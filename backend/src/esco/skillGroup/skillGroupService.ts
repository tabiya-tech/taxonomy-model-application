import { ISkillGroupService } from "./skillGroupService.type";
import { ModelForSkillGroupValidationErrorCode, ISkillGroup, ISkillGroupChild } from "./skillGroup.types";
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
    const sortOrder = desc ? -1 : 1;

    // Get items + 1 to check if there's a next page
    const items = await this.skillGroupRepository.findPaginated(modelId, limit + 1, sortOrder, cursor?.id);

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

  async findParents(id: string): Promise<ISkillGroup[]> {
    return await this.skillGroupRepository.findParents(id);
  }

  async findChildren(id: string): Promise<ISkillGroupChild[]> {
    return await this.skillGroupRepository.findChildren(id);
  }
}
