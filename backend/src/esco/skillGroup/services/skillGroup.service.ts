import {
  ISkillGroupHistoryEntry,
  ISkillGroupService,
  SkillGroupModelValidationError,
  SetSkillGroupParentError,
  SetSkillGroupParentErrorCode,
} from "./skillGroup.service.type";
import {
  ModelForSkillGroupValidationErrorCode,
  INewSkillGroupSpecWithoutImportId,
  ISkillGroup,
  ISkillGroupChild,
} from "../_shared/skillGroup.types";
import { ISkillGroupRepository } from "../repository/SkillGroup.repository";
import { ISkillHierarchyRepository } from "esco/skillHierarchy/skillHierarchyRepository";
import { ObjectTypes } from "esco/common/objectTypes";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillGroupPaginatedFilter } from "./skillGroup.service.type";
import { toModelReference } from "modelInfo/modelInfoReference";
import { IEntityEmbeddingRepository } from "embeddings/entityEmbeddings/entityEmbeddingRepository";
import { ISkillGroupEmbeddingDoc } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IEmbeddingProcessStateRepository } from "embeddings/embeddingProcessState/embeddingProcessStateRepository";
import { EmbeddableField } from "embeddings/service/types";
import { EmbeddingModelServiceFactory, getEmbeddingModelService } from "embeddings/models/embeddingModelServiceFactory";
import { SkillGroupsEmbeddingsVectorSearchIndexName } from "embeddings/entityEmbeddings/vectorSearchIndex.constant";
import { encodeCursor, decodeCursor } from "../GET/query";
import { decodeSearchCursor, encodeSearchCursor } from "esco/common/searchCursor";

export class SkillGroupService implements ISkillGroupService {
  constructor(
    private readonly skillGroupRepository: ISkillGroupRepository,
    private readonly skillHierarchyRepository: ISkillHierarchyRepository,
    private readonly skillGroupEmbeddingRepository: IEntityEmbeddingRepository<ISkillGroupEmbeddingDoc>,
    private readonly embeddingProcessStateRepository: IEmbeddingProcessStateRepository,
    private readonly embeddingModelServiceFactory: EmbeddingModelServiceFactory = getEmbeddingModelService
  ) {}

  async create(newSkillGroupSpec: INewSkillGroupSpecWithoutImportId): Promise<ISkillGroup> {
    const errorCode = await this.validateModelForSkillGroup(newSkillGroupSpec.modelId);
    if (errorCode != null) {
      throw new SkillGroupModelValidationError(errorCode);
    }
    return this.skillGroupRepository.create(newSkillGroupSpec);
  }

  async findById(id: string): Promise<ISkillGroup | null> {
    return this.skillGroupRepository.findById(id);
  }

  async findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc: boolean = true,
    filter?: ISkillGroupPaginatedFilter
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    const sortOrder = desc ? -1 : 1;
    const items = await this.skillGroupRepository.findPaginated(modelId, limit + 1, sortOrder, cursor?.id, filter);
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    let nextCursor: { _id: string; createdAt: Date } | null = null;
    if (hasMore && pageItems.length > 0) {
      const lastItemOnPage = pageItems[pageItems.length - 1];
      nextCursor = {
        _id: lastItemOnPage.id,
        createdAt: lastItemOnPage.createdAt,
      };
    }

    return {
      items: pageItems,
      nextCursor,
    };
  }

  async searchPaginated(
    modelId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: ISkillGroup[]; nextCursor: string | null }> {
    // Vector (embeddings) similarity on released, already-embedded models; a case-insensitive regex otherwise.
    const model = await getRepositoryRegistry().modelInfo.getModelById(modelId);
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

  /**
   * Searches an unreleased (or not-yet-embedded) model's skill groups with a case-insensitive regex, paginated with
   * the same keyset (_id) cursor as the plain list endpoint.
   */
  private async regexSearchPaginated(
    modelId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: ISkillGroup[]; nextCursor: string | null }> {
    // Newest first, consistent with the plain list endpoint's default order.
    const sortOrder = -1;
    const decodedCursorId = cursor ? decodeCursor(cursor).id : undefined;

    const items = await this.skillGroupRepository.findPaginated(
      modelId,
      limit + 1,
      sortOrder,
      decodedCursorId,
      undefined,
      {
        value: searchValue,
        fields: searchFields,
      }
    );

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
   * Searches a released model's skill groups with vector (embeddings) similarity, ranked by relevance and paginated
   * by rank offset. The query value is embedded with the same embedding service the model was embedded with.
   */
  private async vectorSearchPaginated(
    modelId: string,
    embeddingServiceId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: ISkillGroup[]; nextCursor: string | null }> {
    const offset = cursor ? decodeSearchCursor(cursor) : 0;

    const embeddingService = this.embeddingModelServiceFactory(embeddingServiceId);
    const queryVector = await embeddingService.generateEmbedding(searchValue);

    const hits = await this.skillGroupEmbeddingRepository.vectorSearch({
      indexName: SkillGroupsEmbeddingsVectorSearchIndexName,
      modelId,
      embeddingServiceId,
      queryVector,
      searchFields,
      limit: limit + 1,
      offset,
    });

    const hasMore = hits.length > limit;
    const pageHits = hasMore ? hits.slice(0, limit) : hits;

    // Hydrate the ranked ids to full skill groups and re-apply the relevance order (findByIds does not preserve it).
    const ids = pageHits.map((hit) => hit.entityId);
    const skillGroups = await this.skillGroupRepository.findByIds(modelId, ids);
    const skillGroupById = new Map(skillGroups.map((skillGroup) => [skillGroup.id, skillGroup]));
    const items = ids
      .map((id) => skillGroupById.get(id))
      .filter((skillGroup): skillGroup is ISkillGroup => skillGroup !== undefined);

    const nextCursor = hasMore ? encodeSearchCursor(offset + limit) : null;

    return { items, nextCursor };
  }

  async validateModelForSkillGroup(modelId: string): Promise<ModelForSkillGroupValidationErrorCode | null> {
    try {
      const model = await getRepositoryRegistry().modelInfo.getModelById(modelId);
      if (!model) {
        return ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID;
      }
      if (model.released) {
        return ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED;
      }
      return null;
    } catch (e: unknown) {
      console.error("Error validating model for skill group:", e);
      return ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB;
    }
  }

  async findParents(
    modelId: string,
    id: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    return this.findPaginatedRelation(
      () => this.skillGroupRepository.findParents(modelId, id, limit + 1, cursor),
      limit
    );
  }

  async findChildren(
    modelId: string,
    id: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: ISkillGroupChild[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    return this.findPaginatedRelation(
      () => this.skillGroupRepository.findChildren(modelId, id, limit + 1, cursor),
      limit
    );
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

  async setParent(params: {
    childId: string;
    parentId: string;
    parentType: ObjectTypes.SkillGroup;
    modelId: string;
  }): Promise<ISkillGroup> {
    const errorCode = await this.validateModelForSkillGroup(params.modelId);
    if (errorCode != null) {
      throw new SkillGroupModelValidationError(errorCode);
    }

    const child = await this.skillGroupRepository.findById(params.childId);
    if (!child || child.modelId !== params.modelId) {
      throw new SetSkillGroupParentError(SetSkillGroupParentErrorCode.CHILD_NOT_FOUND);
    }

    const parent = await this.skillGroupRepository.findById(params.parentId);
    if (!parent || parent.modelId !== params.modelId) {
      throw new SetSkillGroupParentError(SetSkillGroupParentErrorCode.PARENT_NOT_FOUND);
    }

    await this.skillHierarchyRepository.createMany(params.modelId, [
      {
        childId: params.childId,
        childType: ObjectTypes.SkillGroup,
        parentId: params.parentId,
        parentType: params.parentType,
      },
    ]);

    return parent;
  }

  async getHistory(skillGroupId: string): Promise<ISkillGroupHistoryEntry[] | null> {
    const skillGroup = await this.skillGroupRepository.findById(skillGroupId);
    if (!skillGroup) {
      return null;
    }

    // The skill group's UUIDHistory holds its OWN past UUIDs (one per model it existed in), newest first.
    // To list the models it appeared in we resolve: UUID -> skill group entity -> its modelId -> model.
    const uuidHistory = skillGroup.UUIDHistory ?? [];
    if (uuidHistory.length === 0) {
      return [];
    }

    const modelRepository = getRepositoryRegistry().modelInfo;

    // Resolve each historical UUID to the skill group's reference (as it was in that model) + its modelId.
    const historyReferences = await this.skillGroupRepository.findHistoryReferencesByUUIDs(uuidHistory);
    const referenceByUUID = new Map(historyReferences.map((entry) => [entry.UUID, entry]));

    // Fetch the models for the resolved modelIds (single query) and map them to lightweight references.
    const modelIds = Array.from(
      new Set(historyReferences.map((entry) => entry.modelId).filter((id): id is string => id !== null))
    );
    const resolvedModels = modelIds.length > 0 ? await modelRepository.getModelsByIds(modelIds) : [];
    const modelById = new Map(resolvedModels.map((model) => [model.id, model]));

    // Walk the skill group's UUIDHistory (newest first), skipping UUIDs whose entity or model no longer exists.
    // A given model appears at most once even if multiple history UUIDs map to it.
    const history: ISkillGroupHistoryEntry[] = [];
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
