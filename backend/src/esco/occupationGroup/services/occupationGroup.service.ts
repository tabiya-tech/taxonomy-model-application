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
import { IModelInfoReference } from "modelInfo/modelInfo.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationHierarchyRepository } from "esco/occupationHierarchy/occupationHierarchyRepository";

export class OccupationGroupService implements IOccupationGroupService {
  constructor(
    private readonly occupationGroupRepository: IOccupationGroupRepository,
    private occupationHierarchyRepository: IOccupationHierarchyRepository
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

    // Resolve each historical UUID to the modelId of the occupation group with that UUID (single query).
    const uuidToModelId = await this.occupationGroupRepository.findModelIdsByUUIDs(uuidHistory);
    const modelIdByUUID = new Map(uuidToModelId.map((entry) => [entry.UUID, entry.modelId]));

    // Fetch the full models for the resolved modelIds (single query).
    const modelIds = Array.from(new Set(modelIdByUUID.values()));
    const resolvedModels = modelIds.length > 0 ? await modelRepository.getModelsByIds(modelIds) : [];
    const modelById = new Map(resolvedModels.map((model) => [model.id, model]));

    // Resolve the modelHistory references for every resolved model's own UUIDHistory (single query).
    const allModelHistoryUUIDs = Array.from(new Set(resolvedModels.flatMap((model) => model.UUIDHistory)));
    const references = allModelHistoryUUIDs.length > 0 ? await modelRepository.getHistory(allModelHistoryUUIDs) : [];
    const referenceByUUID = new Map(references.map((reference) => [reference.UUID, reference]));

    // Walk the occupation group's UUIDHistory (newest first), skipping UUIDs whose entity or model no longer
    // exists. A given model appears at most once even if multiple history UUIDs map to it.
    const history: IOccupationGroupHistoryEntry[] = [];
    const seenModelIds = new Set<string>();
    for (const uuid of uuidHistory) {
      const modelId = modelIdByUUID.get(uuid);
      if (!modelId || seenModelIds.has(modelId)) {
        continue;
      }
      const model = modelById.get(modelId);
      if (!model) {
        continue;
      }
      seenModelIds.add(modelId);
      const modelHistoryDetails: IModelInfoReference[] = model.UUIDHistory.map(
        (historyUUID) =>
          referenceByUUID.get(historyUUID) ?? {
            id: null,
            UUID: historyUUID,
            name: null,
            version: null,
            localeShortCode: null,
          }
      );
      history.push({ model, modelHistoryDetails });
    }

    return history;
  }
}
