import mongoose from "mongoose";
import {
  IOccupationService,
  ModalForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "./occupationService.types";
import { INewOccupationSpecWithoutImportId, IOccupation } from "./occupation.types";
import { IOccupationRepository } from "./occupationRepository";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";

export class OccupationService implements IOccupationService {
  constructor(private readonly occupationRepository: IOccupationRepository) {}

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
    // Build filter for pagination
    const sortOrder = desc ? -1 : 1;
    let filter: Record<string, unknown> = {};
    if (cursor) {
      const cursorId = new mongoose.Types.ObjectId(cursor.id);
      filter = { _id: sortOrder === -1 ? { $lt: cursorId } : { $gt: cursorId } };
    }

    // Get items + 1 to check if there's a next page
    const items = await this.occupationRepository.findPaginated(modelId, filter, { _id: sortOrder }, limit + 1);

    // Check if there's a next page
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    // Construct nextCursor from the extra item if there's more
    let nextCursor: { _id: string; createdAt: Date } | null = null;
    if (hasMore) {
      const nextItem = items[limit];
      nextCursor = {
        _id: nextItem.id,
        createdAt: nextItem.createdAt,
      };
    }

    return {
      items: pageItems,
      nextCursor,
    };
  }

  async validateModelForOccupation(modelId: string): Promise<ModalForOccupationValidationErrorCode | null> {
    try {
      const model = await getRepositoryRegistry().modelInfo.getModelById(modelId);
      if (!model) {
        return ModalForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID;
      }
      if (model.released) {
        return ModalForOccupationValidationErrorCode.MODEL_IS_RELEASED;
      }
      return null;
    } catch (e: unknown) {
      console.error("Failed to validate model for occupation creation", e);
      return ModalForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB;
    }
  }
}
