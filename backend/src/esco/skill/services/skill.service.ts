import { ISkillHistoryEntry, ISkillService, SkillModelValidationError } from "./skill.service.types";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { toModelReference } from "modelInfo/modelInfoReference";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { ISkill, INewSkillSpecWithoutImportId, ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import { IEntityEmbeddingRepository } from "embeddings/entityEmbeddings/entityEmbeddingRepository";
import { ISkillEmbeddingDoc } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IEmbeddingProcessStateRepository } from "embeddings/embeddingProcessState/embeddingProcessStateRepository";
import { EmbeddableField } from "embeddings/service/types";
import { EmbeddingModelServiceFactory, getEmbeddingModelService } from "embeddings/models/embeddingModelServiceFactory";
import { SkillsEmbeddingsVectorSearchIndexName } from "embeddings/entityEmbeddings/vectorSearchIndex.constant";
import { encodeCursor } from "esco/occupations/_shared/pagination/encodeCursor";
import { decodeCursor } from "esco/occupations/_shared/pagination/decodeCursor";
import { decodeSearchCursor, encodeSearchCursor } from "../_shared/searchCursor";

export class SkillService implements ISkillService {
  constructor(
    private readonly skillRepository: ISkillRepository,
    private readonly modelRepository: IModelRepository,
    private readonly skillEmbeddingRepository: IEntityEmbeddingRepository<ISkillEmbeddingDoc>,
    private readonly embeddingProcessStateRepository: IEmbeddingProcessStateRepository,
    private readonly embeddingModelServiceFactory: EmbeddingModelServiceFactory = getEmbeddingModelService
  ) {}

  async create(newSkillSpec: INewSkillSpecWithoutImportId): Promise<ISkill> {
    const errorCode = await this.validateModelForSkill(newSkillSpec.modelId);
    if (errorCode != null) {
      throw new SkillModelValidationError(errorCode);
    }

    return await this.skillRepository.create(newSkillSpec);
  }

  async findById(id: string): Promise<ISkill | null> {
    return this.skillRepository.findById(id);
  }

  async findPaginated(
    modelId: string,
    cursor: string | undefined,
    limit: number,
    searchValue?: string,
    searchFields: EmbeddableField[] = [EmbeddableField.preferredLabel],
    desc: boolean = true
  ): Promise<{ items: ISkill[]; nextCursor: string | null }> {
    // When a search value is provided, search instead of plain listing: vector (embeddings) similarity on
    // released, already-embedded models; a case-insensitive regex otherwise. Both return an already-encoded cursor.
    if (searchValue !== undefined) {
      const model = await this.modelRepository.getModelById(modelId);
      if (model?.released) {
        const completedProcess = await this.embeddingProcessStateRepository.findCompletedByModelId(modelId);
        if (completedProcess) {
          return this.vectorSearchPaginated(
            modelId,
            completedProcess.embeddingServiceId,
            searchValue,
            searchFields,
            cursor,
            limit
          );
        }
        // The model is released but its embeddings have not been generated (completed) yet, so there is nothing to
        // search with vectors. Fall back to regex so the endpoint still returns useful results.
      }
      return this.regexSearchPaginated(modelId, searchValue, searchFields, cursor, limit);
    }

    // Plain keyset pagination ordered by createdAt then _id.
    const sortOrder = desc ? -1 : 1;
    const decodedCursor = cursor ? decodeCursor(cursor) : undefined;

    // Get items + 1 to check if there's a next page
    const items = await this.skillRepository.findPaginated(modelId, limit + 1, sortOrder, decodedCursor);

    // Check if there's a next page
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    // Construct nextCursor from the last item of the current page
    let nextCursor: string | null = null;
    if (hasMore && pageItems.length > 0) {
      const lastItemOnPage = pageItems[pageItems.length - 1];
      nextCursor = encodeCursor(lastItemOnPage.id, lastItemOnPage.createdAt);
    }

    return {
      items: pageItems,
      nextCursor,
    };
  }

  /**
   * Searches an unreleased (or not-yet-embedded) model's skills with a case-insensitive regex, paginated with the
   * same keyset cursor as the plain list endpoint (ordered by createdAt then _id).
   */
  private async regexSearchPaginated(
    modelId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: ISkill[]; nextCursor: string | null }> {
    // Newest first, consistent with the plain list endpoint's default order.
    const sortOrder = -1;
    const decodedCursor = cursor ? decodeCursor(cursor) : undefined;

    const items = await this.skillRepository.findPaginated(modelId, limit + 1, sortOrder, decodedCursor, {
      value: searchValue,
      fields: searchFields,
    });

    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    let nextCursor: string | null = null;
    if (hasMore && pageItems.length > 0) {
      const lastItemOnPage = pageItems[pageItems.length - 1];
      nextCursor = encodeCursor(lastItemOnPage.id, lastItemOnPage.createdAt);
    }

    return { items: pageItems, nextCursor };
  }

  /**
   * Searches a released model's skills with vector (embeddings) similarity, ranked by relevance and paginated by
   * rank offset. The query value is embedded with the same embedding service the model was embedded with.
   */
  private async vectorSearchPaginated(
    modelId: string,
    embeddingServiceId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: ISkill[]; nextCursor: string | null }> {
    const offset = cursor ? decodeSearchCursor(cursor) : 0;

    const embeddingService = this.embeddingModelServiceFactory(embeddingServiceId);
    const queryVector = await embeddingService.generateEmbedding(searchValue);

    const hits = await this.skillEmbeddingRepository.vectorSearch({
      indexName: SkillsEmbeddingsVectorSearchIndexName,
      modelId,
      embeddingServiceId,
      queryVector,
      searchFields,
      limit: limit + 1,
      offset,
    });

    const hasMore = hits.length > limit;
    const pageHits = hasMore ? hits.slice(0, limit) : hits;

    // Hydrate the ranked ids to full skills and re-apply the relevance order (findByIds does not preserve it).
    const ids = pageHits.map((hit) => hit.entityId);
    const skills = await this.skillRepository.findByIds(modelId, ids);
    const skillById = new Map(skills.map((skill) => [skill.id, skill]));
    const items = ids.map((id) => skillById.get(id)).filter((skill): skill is ISkill => skill !== undefined);

    const nextCursor = hasMore ? encodeSearchCursor(offset + limit) : null;

    return { items, nextCursor };
  }

  async validateModelForSkill(modelId: string): Promise<ModelForSkillValidationErrorCode | null> {
    try {
      const model = await this.modelRepository.getModelById(modelId);
      if (!model) {
        return ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID;
      }
      if (model.released) {
        return ModelForSkillValidationErrorCode.MODEL_IS_RELEASED;
      }
      return null;
    } catch (e: unknown) {
      console.error("Error validating model for skill:", e);
      return ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB;
    }
  }

  async getParents(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: (ISkill | ISkillGroup)[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    return this.findPaginatedRelation(
      () => this.skillRepository.findParents(modelId, skillId, limit + 1, cursor),
      limit
    );
  }

  async getChildren(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: (ISkill | ISkillGroup)[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    return this.findPaginatedRelation(
      () => this.skillRepository.findChildren(modelId, skillId, limit + 1, cursor),
      limit
    );
  }

  async getOccupations(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{
    items: OccupationToSkillReferenceWithRelationType<IOccupationReference>[];
    nextCursor: { _id: string; createdAt: Date } | null;
  }> {
    return this.findPaginatedRelation(
      () => this.skillRepository.findOccupationsForSkill(modelId, skillId, limit + 1, cursor),
      limit
    );
  }

  async getRelatedSkills(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{
    items: SkillToSkillReferenceWithRelationType<ISkill>[];
    nextCursor: { _id: string; createdAt: Date } | null;
  }> {
    const items = await this.skillRepository.findRelatedSkills(modelId, skillId, limit + 1, cursor);
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    let nextCursor: { _id: string; createdAt: Date } | null = null;
    if (hasMore && pageItems.length > 0) {
      const lastItem = pageItems[pageItems.length - 1] as ISkill & { relationId?: string };
      if (lastItem.relationId) {
        nextCursor = { _id: lastItem.relationId, createdAt: lastItem.createdAt ?? new Date() };
      }
    }

    return { items: pageItems, nextCursor };
  }

  private async findPaginatedRelation<T extends { id: string; createdAt?: Date }>(
    fetchFn: () => Promise<T[]>,
    limit: number
  ): Promise<{ items: T[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    const items = await fetchFn();
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    let nextCursor: { _id: string; createdAt: Date } | null = null;
    if (hasMore && pageItems.length > 0) {
      const lastItemOnPage = pageItems[pageItems.length - 1];
      nextCursor = {
        _id: lastItemOnPage.id,
        createdAt: lastItemOnPage.createdAt ?? new Date(),
      };
    }

    return { items: pageItems, nextCursor };
  }

  async getHistory(skillId: string): Promise<ISkillHistoryEntry[] | null> {
    const skill = await this.skillRepository.findById(skillId);
    if (!skill) {
      return null;
    }

    // The skill's UUIDHistory holds the skill's OWN past UUIDs (one per model it existed in), newest first.
    // To list the models it appeared in we resolve: UUID -> skill entity -> its modelId -> model.
    const uuidHistory = skill.UUIDHistory ?? [];
    if (uuidHistory.length === 0) {
      return [];
    }

    // Resolve each historical UUID to the skill's reference (as it was in that model) + its modelId.
    const historyReferences = await this.skillRepository.findHistoryReferencesByUUIDs(uuidHistory);
    const referenceByUUID = new Map(historyReferences.map((entry) => [entry.UUID, entry]));

    // Fetch the models for the resolved modelIds (single query) and map them to lightweight references.
    const modelIds = Array.from(
      new Set(historyReferences.map((entry) => entry.modelId).filter((id): id is string => id !== null))
    );
    const resolvedModels = modelIds.length > 0 ? await this.modelRepository.getModelsByIds(modelIds) : [];
    const modelById = new Map(resolvedModels.map((model) => [model.id, model]));

    // Walk the skill's UUIDHistory (newest first), skipping UUIDs whose skill or model no longer exists.
    // A given model appears at most once even if multiple history UUIDs map to it.
    const history: ISkillHistoryEntry[] = [];
    const seenModelIds = new Set<string>();
    for (const uuid of uuidHistory) {
      const entry = referenceByUUID.get(uuid);
      if (!entry || entry.modelId === null || entry.reference === null || seenModelIds.has(entry.modelId)) {
        continue;
      }
      const model = modelById.get(entry.modelId);
      if (!model) {
        continue;
      }
      seenModelIds.add(entry.modelId);
      history.push({ entity: entry.reference, model: toModelReference(model) });
    }

    return history;
  }
}
