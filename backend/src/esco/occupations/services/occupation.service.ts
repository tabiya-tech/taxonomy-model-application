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

export class OccupationService implements IOccupationService {
  private readonly occupationRepository: IOccupationRepository;
  private readonly modelRepository: IModelRepository;

  constructor(occupationRepository: IOccupationRepository, modelRepository: IModelRepository) {
    this.occupationRepository = occupationRepository;
    this.modelRepository = modelRepository;
  }

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
