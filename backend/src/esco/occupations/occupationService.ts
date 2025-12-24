import {
  IOccupationService,
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "./occupationService.types";
import { INewOccupationSpecWithoutImportId, IOccupation } from "./occupation.types";
import { IOccupationRepository } from "./occupationRepository";
import { IModelRepository } from "modelInfo/modelInfoRepository";

export class OccupationService implements IOccupationService {
  constructor(
    private readonly occupationRepository: IOccupationRepository,
    private readonly modelRepository: IModelRepository
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

    // Get items + 1 to check if there's a next page
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
      if (!model) {
        return ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID;
      }
      if (model.released) {
        return ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED;
      }
      return null;
    } catch (e: unknown) {
      console.error("Failed to validate model for occupation creation", e);
      return ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB;
    }
  }
}
