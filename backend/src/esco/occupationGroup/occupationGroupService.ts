import mongoose from "mongoose";
import { IOccupationGroupService, OccupationGroupModelValidationError } from "./occupationGroupService.type";
import {
  ModelForOccupationGroupValidationErrorCode,
  INewOccupationGroupSpecWithoutImportId,
  IOccupationGroup,
} from "./OccupationGroup.types";
import { IOccupationGroupRepository } from "./OccupationGroupRepository";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";

export class OccupationGroupService implements IOccupationGroupService {
  constructor(private readonly occupationGroupRepository: IOccupationGroupRepository) {}

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
  async findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc: boolean = true
  ): Promise<{ items: IOccupationGroup[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    // Build filter for pagination
    const sortOrder = desc ? -1 : 1;
    let filter: Record<string, unknown> = {};
    if (cursor) {
      const cursorId = new mongoose.Types.ObjectId(cursor.id);
      filter = { _id: sortOrder === -1 ? { $lt: cursorId } : { $gt: cursorId } };
    }

    // Get items + 1 to check if there's a next page
    const items = await this.occupationGroupRepository.findPaginated(modelId, filter, { _id: sortOrder }, limit + 1);

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
}
