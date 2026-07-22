import {
  IOccupationGroupHistoryEntry,
  FindPaginatedFilter,
  IOccupationGroupService,
  OccupationGroupModelValidationError,
  SetOccupationGroupParentError,
  SetOccupationGroupParentErrorCode,
} from "./occupationGroup.service.type";
import {
  ModelForOccupationGroupValidationErrorCode,
  INewOccupationGroupSpecWithoutImportId,
  IOccupationGroup,
  IOccupationGroupChild,
} from "esco/occupationGroup/_shared/OccupationGroup.types";
import { IOccupationGroupRepository } from "esco/occupationGroup/repository/OccupationGroup.repository";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { toModelReference } from "modelInfo/modelInfoReference";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationHierarchyRepository } from "esco/occupationHierarchy/occupationHierarchyRepository";
import { IEntityEmbeddingRepository } from "embeddings/entityEmbeddings/entityEmbeddingRepository";
import { IOccupationGroupEmbeddingDoc } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IEmbeddingProcessStateRepository } from "embeddings/embeddingProcessState/embeddingProcessStateRepository";
import { EmbeddableField } from "embeddings/service/types";
import { EmbeddingModelServiceFactory, getEmbeddingModelService } from "embeddings/models/embeddingModelServiceFactory";
import { OccupationGroupsEmbeddingsVectorSearchIndexName } from "embeddings/entityEmbeddings/vectorSearchIndex.constant";
import { encodeCursor, decodeCursor } from "../GET/query";
import { decodeSearchCursor, encodeSearchCursor } from "esco/common/searchCursor";

export class OccupationGroupService implements IOccupationGroupService {
  constructor(
    private readonly occupationGroupRepository: IOccupationGroupRepository,
    private occupationHierarchyRepository: IOccupationHierarchyRepository,
    private readonly occupationGroupEmbeddingRepository: IEntityEmbeddingRepository<IOccupationGroupEmbeddingDoc>,
    private readonly embeddingProcessStateRepository: IEmbeddingProcessStateRepository,
    private readonly embeddingModelServiceFactory: EmbeddingModelServiceFactory = getEmbeddingModelService
  ) {}

  async create(newOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId): Promise<IOccupationGroup> {
    // Validate model exists and is not released
    const errorCode = await this.validateModelForOccupationGroup(newOccupationGroupSpec.modelId);
    if (errorCode != null) {
      throw new OccupationGroupModelValidationError(errorCode);
    }
    return this.occupationGroupRepository.create(newOccupationGroupSpec);
  }

  async findById(id: string): Promise<IOccupationGroup | null> {
    return this.occupationGroupRepository.findById(id);
  }

  async findParent(id: string): Promise<IOccupationGroup | null> {
    return await this.occupationGroupRepository.findParent(id);
  }

  async findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc: boolean = true,
    filter?: FindPaginatedFilter
  ): Promise<{ items: IOccupationGroup[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    const sortOrder = desc ? -1 : 1;

    // Get items + 1 to check if there's a next page
    const items = await this.occupationGroupRepository.findPaginated(modelId, limit + 1, sortOrder, cursor?.id, filter);

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
  ): Promise<{ items: IOccupationGroup[]; nextCursor: string | null }> {
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
   * Searches an unreleased (or not-yet-embedded) model's occupation groups with a case-insensitive regex,
   * paginated with the same keyset (_id) cursor as the plain list endpoint.
   */
  private async regexSearchPaginated(
    modelId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: IOccupationGroup[]; nextCursor: string | null }> {
    // Newest first, consistent with the plain list endpoint's default order.
    const sortOrder = -1;
    const decodedCursorId = cursor ? decodeCursor(cursor).id : undefined;

    const items = await this.occupationGroupRepository.findPaginated(
      modelId,
      limit + 1,
      sortOrder,
      decodedCursorId,
      undefined,
      { value: searchValue, fields: searchFields }
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
   * Searches a released model's occupation groups with vector (embeddings) similarity, ranked by relevance and
   * paginated by rank offset. The query value is embedded with the same embedding service the model was embedded
   * with.
   */
  private async vectorSearchPaginated(
    modelId: string,
    embeddingServiceId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: IOccupationGroup[]; nextCursor: string | null }> {
    const offset = cursor ? decodeSearchCursor(cursor) : 0;

    const embeddingService = this.embeddingModelServiceFactory(embeddingServiceId);
    const queryVector = await embeddingService.generateEmbedding(searchValue);

    const hits = await this.occupationGroupEmbeddingRepository.vectorSearch({
      indexName: OccupationGroupsEmbeddingsVectorSearchIndexName,
      modelId,
      embeddingServiceId,
      queryVector,
      searchFields,
      limit: limit + 1,
      offset,
    });

    const hasMore = hits.length > limit;
    const pageHits = hasMore ? hits.slice(0, limit) : hits;

    // Hydrate the ranked ids to full occupation groups and re-apply the relevance order (findByIds does not
    // preserve it).
    const ids = pageHits.map((hit) => hit.entityId);
    const occupationGroups = await this.occupationGroupRepository.findByIds(modelId, ids);
    const occupationGroupById = new Map(occupationGroups.map((group) => [group.id, group]));
    const items = ids
      .map((id) => occupationGroupById.get(id))
      .filter((group): group is IOccupationGroup => group !== undefined);

    const nextCursor = hasMore ? encodeSearchCursor(offset + limit) : null;

    return { items, nextCursor };
  }

  async findChildren(id: string): Promise<IOccupationGroupChild[]> {
    return await this.occupationGroupRepository.findChildren(id);
  }

  async setParent(params: {
    childId: string;
    parentId: string;
    parentType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup;
    modelId: string;
  }): Promise<IOccupationGroup> {
    const errorCode = await this.validateModelForOccupationGroup(params.modelId);
    if (errorCode != null) {
      throw new OccupationGroupModelValidationError(errorCode);
    }

    const child = await this.occupationGroupRepository.findById(params.childId);
    if (!child || child.modelId !== params.modelId) {
      throw new SetOccupationGroupParentError(SetOccupationGroupParentErrorCode.CHILD_NOT_FOUND);
    }

    const parent = await this.occupationGroupRepository.findById(params.parentId);
    if (!parent || parent.modelId !== params.modelId) {
      throw new SetOccupationGroupParentError(SetOccupationGroupParentErrorCode.PARENT_NOT_FOUND);
    }

    await this.occupationHierarchyRepository.createMany(params.modelId, [
      {
        childId: params.childId,
        childType: child.groupType,
        parentId: params.parentId,
        parentType: params.parentType,
      },
    ]);

    return parent;
  }

  async validateModelForOccupationGroup(modelId: string): Promise<ModelForOccupationGroupValidationErrorCode | null> {
    try {
      const model = await getRepositoryRegistry().modelInfo.getModelById(modelId);
      if (!model) {
        return ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID;
      }
      if (model.released) {
        return ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED;
      }
      return null;
    } catch (e: unknown) {
      console.error("Error validating model for occupation group:", e);
      return ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB;
    }
  }

  async getHistory(occupationGroupId: string): Promise<IOccupationGroupHistoryEntry[] | null> {
    const occupationGroup = await this.occupationGroupRepository.findById(occupationGroupId);
    if (!occupationGroup) {
      return null;
    }

    // The occupation group's UUIDHistory holds its OWN past UUIDs (one per model it existed in), newest first.
    // To list the models it appeared in we resolve: UUID -> occupation group entity -> its modelId -> model.
    const uuidHistory = occupationGroup.UUIDHistory ?? [];
    if (uuidHistory.length === 0) {
      return [];
    }

    const modelRepository = getRepositoryRegistry().modelInfo;

    // Resolve each historical UUID to the occupation group's reference (as it was in that model) + its modelId.
    const historyReferences = await this.occupationGroupRepository.findHistoryReferencesByUUIDs(uuidHistory);
    const referenceByUUID = new Map(historyReferences.map((entry) => [entry.UUID, entry]));

    // Fetch the models for the resolved modelIds (single query) and map them to lightweight references.
    const modelIds = Array.from(
      new Set(historyReferences.map((entry) => entry.modelId).filter((id): id is string => id !== null))
    );
    const resolvedModels = modelIds.length > 0 ? await modelRepository.getModelsByIds(modelIds) : [];
    const modelById = new Map(resolvedModels.map((model) => [model.id, model]));

    // Walk the occupation group's UUIDHistory (newest first), skipping UUIDs whose entity or model no longer
    // exists. A given model appears at most once even if multiple history UUIDs map to it.
    const history: IOccupationGroupHistoryEntry[] = [];
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
