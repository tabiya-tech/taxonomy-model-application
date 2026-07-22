import {
  IOccupationHistoryEntry,
  IOccupationService,
  ISkillWithRelation,
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "./occupation.service.types";
import {
  INewOccupationSpecWithoutImportId,
  IOccupation,
  IPartialUpdateOccupationSpec,
  IUpdateOccupationSpec,
} from "../_shared/occupation.types";
import { IOccupationRepository } from "../repository/occupation.repository";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { toModelReference } from "modelInfo/modelInfoReference";
import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { IEntityEmbeddingRepository } from "embeddings/entityEmbeddings/entityEmbeddingRepository";
import { IOccupationEmbeddingDoc } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IEmbeddingProcessStateRepository } from "embeddings/embeddingProcessState/embeddingProcessStateRepository";
import { EmbeddableField } from "embeddings/service/types";
import { EmbeddingModelServiceFactory, getEmbeddingModelService } from "embeddings/models/embeddingModelServiceFactory";
import { OccupationsEmbeddingsVectorSearchIndexName } from "embeddings/entityEmbeddings/vectorSearchIndex.constant";
import { encodeCursor } from "../_shared/pagination/encodeCursor";
import { decodeCursor } from "../_shared/pagination/decodeCursor";
import { decodeSearchCursor, encodeSearchCursor } from "esco/common/searchCursor";

export class OccupationService implements IOccupationService {
  constructor(
    private readonly occupationRepository: IOccupationRepository,
    private readonly modelRepository: IModelRepository,
    private readonly occupationEmbeddingRepository: IEntityEmbeddingRepository<IOccupationEmbeddingDoc>,
    private readonly embeddingProcessStateRepository: IEmbeddingProcessStateRepository,
    private readonly embeddingModelServiceFactory: EmbeddingModelServiceFactory = getEmbeddingModelService
  ) {}

  async create(newOccupationSpec: INewOccupationSpecWithoutImportId): Promise<IOccupation> {
    // Validate model exists and is not released
    const errorCode = await this.validateModelForOccupation(newOccupationSpec.modelId);
    if (errorCode != null) {
      throw new OccupationModelValidationError(errorCode);
    }

    return this.occupationRepository.create(newOccupationSpec);
  }

  async findById(id: string): Promise<IOccupation | null> {
    return this.occupationRepository.findById(id);
  }

  async findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc: boolean = true
  ): Promise<{ items: IOccupation[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    const sortOrder = desc ? -1 : 1;
    const items = await this.occupationRepository.findPaginated(modelId, limit + 1, sortOrder, cursor?.id);

    // Check if there's a next page
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    // Construct nextCursor from the last item of the current page
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
  ): Promise<{ items: IOccupation[]; nextCursor: string | null }> {
    // Vector (embeddings) similarity on released, already-embedded models; a case-insensitive regex otherwise.
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

  /**
   * Searches an unreleased (or not-yet-embedded) model's occupations with a case-insensitive regex, paginated with
   * the same keyset (_id) cursor as the plain list endpoint.
   */
  private async regexSearchPaginated(
    modelId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: IOccupation[]; nextCursor: string | null }> {
    // Newest first, consistent with the plain list endpoint's default order.
    const sortOrder = -1;
    const decodedCursorId = cursor ? decodeCursor(cursor).id : undefined;

    const items = await this.occupationRepository.findPaginated(
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
   * Searches a released model's occupations with vector (embeddings) similarity, ranked by relevance and paginated
   * by rank offset. The query value is embedded with the same embedding service the model was embedded with.
   */
  private async vectorSearchPaginated(
    modelId: string,
    embeddingServiceId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: IOccupation[]; nextCursor: string | null }> {
    const offset = cursor ? decodeSearchCursor(cursor) : 0;

    const embeddingService = this.embeddingModelServiceFactory(embeddingServiceId);
    const queryVector = await embeddingService.generateEmbedding(searchValue);

    const hits = await this.occupationEmbeddingRepository.vectorSearch({
      indexName: OccupationsEmbeddingsVectorSearchIndexName,
      modelId,
      embeddingServiceId,
      queryVector,
      searchFields,
      limit: limit + 1,
      offset,
    });

    const hasMore = hits.length > limit;
    const pageHits = hasMore ? hits.slice(0, limit) : hits;

    // Hydrate the ranked ids to full occupations and re-apply the relevance order (findByIds does not preserve it).
    const ids = pageHits.map((hit) => hit.entityId);
    const occupations = await this.occupationRepository.findByIds(modelId, ids);
    const occupationById = new Map(occupations.map((occupation) => [occupation.id, occupation]));
    const items = ids
      .map((id) => occupationById.get(id))
      .filter((occupation): occupation is IOccupation => occupation !== undefined);

    const nextCursor = hasMore ? encodeSearchCursor(offset + limit) : null;

    return { items, nextCursor };
  }

  async validateModelForOccupation(modelId: string): Promise<ModelForOccupationValidationErrorCode | null> {
    try {
      const model = await this.modelRepository.getModelById(modelId);
      if (model == null) {
        return ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID;
      }
      if (model.released) {
        return ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED;
      }
      return null;
    } catch (e: unknown) {
      return ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB;
    }
  }

  async getParent(modelId: string, occupationId: string): Promise<IOccupation | IOccupationGroup | null> {
    return this.occupationRepository.findParent(modelId, occupationId);
  }

  async getChildren(
    modelId: string,
    occupationId: string,
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: IOccupation[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    const items = await this.occupationRepository.findChildren(modelId, occupationId, limit + 1, cursor);

    // Check if there's a next page
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    // Construct nextCursor from the last item of the current page
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

  async getSkills(
    modelId: string,
    occupationId: string,
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: ISkillWithRelation[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    const items = await this.occupationRepository.findSkillsForOccupation(modelId, occupationId, limit + 1, cursor);

    // Check if there's a next page
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    // Construct nextCursor from the last item of the current page
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

  async getHistory(occupationId: string): Promise<IOccupationHistoryEntry[] | null> {
    const occupation = await this.occupationRepository.findById(occupationId);
    if (!occupation) {
      return null;
    }

    const uuidHistory = occupation.UUIDHistory ?? [];
    if (uuidHistory.length === 0) return [];

    const historyReferences = await this.occupationRepository.findHistoryReferencesByUUIDs(uuidHistory);
    const referenceByUUID = new Map(historyReferences.map((entry) => [entry.UUID, entry]));

    const modelIds = Array.from(
      new Set(historyReferences.map((entry) => entry.modelId).filter((id): id is string => id !== null))
    );
    const resolvedModels = modelIds.length > 0 ? await this.modelRepository.getModelsByIds(modelIds) : [];
    const modelById = new Map(resolvedModels.map((model) => [model.id, model]));

    const history: IOccupationHistoryEntry[] = [];
    const seenModelIds = new Set<string>();
    for (const uuid of uuidHistory) {
      const entry = referenceByUUID.get(uuid);
      if (!entry || entry.modelId === null || entry.reference === null || seenModelIds.has(entry.modelId)) {
        continue;
      }
      const model = modelById.get(entry.modelId);
      if (!model) continue;
      seenModelIds.add(entry.modelId);
      history.push({ entity: entry.reference, model: toModelReference(model) });
    }

    return history;
  }

  async update(id: string, modelId: string, spec: IUpdateOccupationSpec): Promise<IOccupation | null> {
    const errorCode = await this.validateModelForOccupation(modelId);
    if (errorCode != null) {
      throw new OccupationModelValidationError(errorCode);
    }
    return this.occupationRepository.update(id, modelId, spec);
  }

  async patch(id: string, modelId: string, spec: IPartialUpdateOccupationSpec): Promise<IOccupation | null> {
    const errorCode = await this.validateModelForOccupation(modelId);
    if (errorCode != null) {
      throw new OccupationModelValidationError(errorCode);
    }
    return this.occupationRepository.patch(id, modelId, spec);
  }
}
