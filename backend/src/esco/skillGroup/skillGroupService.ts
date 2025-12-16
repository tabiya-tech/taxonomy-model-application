import mongoose from "mongoose";
import { ISkillGroupService } from "./skillGroupService.type";
import { ModalForSkillGroupValidationErrorCode, ISkillGroup } from "./skillGroup.types";
import { ISkillGroupRepository } from "./skillGroupRepository";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";

export class SkillGroupService implements ISkillGroupService {
  constructor(private readonly skillGroupRepository: ISkillGroupRepository) {}
  async findById(id: string): Promise<ISkillGroup | null> {
    return this.skillGroupRepository.findById(id);
  }
  async findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc: boolean = true
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    // Build filter for pagination
    const sortOrder = desc ? -1 : 1;
    let filter: Record<string, unknown> = {};
    if (cursor) {
      const cursorId = new mongoose.Types.ObjectId(cursor.id);
      filter = { _id: sortOrder === -1 ? { $lt: cursorId } : { $gt: cursorId } };
    }
    // Get items + 1 to check if there's a next page
    const items = await this.skillGroupRepository.findPaginated(modelId, filter, { _id: sortOrder }, limit + 1);
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
  async validateModelForSkillGroup(modelId: string): Promise<ModalForSkillGroupValidationErrorCode | null> {
    try {
      const model = await getRepositoryRegistry().modelInfo.getModelById(modelId);
      if (!model) {
        return ModalForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID;
      }
      if (model.released) {
        return ModalForSkillGroupValidationErrorCode.MODEL_IS_RELEASED;
      }
      return null;
    } catch (e: unknown) {
      console.error("Error validating model for skill group:", e);
      return ModalForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB;
    }
  }
}
