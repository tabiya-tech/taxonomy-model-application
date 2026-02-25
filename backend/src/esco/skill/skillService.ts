import { ISkillService } from "./skillService.type";
import { ISkill } from "./skills.types";
import { ISkillRepository } from "./skillRepository";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { ModelForSkillValidationErrorCode } from "./skills.types";
import { ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

export class SkillService implements ISkillService {
  constructor(
    private readonly skillRepository: ISkillRepository,
    private readonly modelRepository: IModelRepository
  ) {}

  async findById(id: string): Promise<ISkill | null> {
    return this.skillRepository.findById(id);
  }

  async findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc: boolean = true
  ): Promise<{ items: ISkill[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    const sortOrder = desc ? -1 : 1;

    // Get items + 1 to check if there's a next page
    const items = await this.skillRepository.findPaginated(modelId, limit + 1, sortOrder, cursor);

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

  async validateModelForSkill(modelId: string): Promise<ModelForSkillValidationErrorCode | null> {
    try {
      const model = await this.modelRepository.getModelById(modelId);
      if (!model) {
        return ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID;
      }
      if (model.released) {
        return ModelForSkillValidationErrorCode.MODEL_IS_RELEASED;
      }
      return null;
    } catch (e: unknown) {
      console.error("Error validating model for skill:", e);
      return ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB;
    }
  }

  async getParents(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: (ISkill | ISkillGroup)[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    return this.findPaginatedRelation(
      () => this.skillRepository.findParents(modelId, skillId, limit + 1, cursor),
      limit
    );
  }

  async getChildren(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: (ISkill | ISkillGroup)[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    return this.findPaginatedRelation(
      () => this.skillRepository.findChildren(modelId, skillId, limit + 1, cursor),
      limit
    );
  }

  async getOccupations(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{
    items: OccupationToSkillReferenceWithRelationType<IOccupationReference>[];
    nextCursor: { _id: string; createdAt: Date } | null;
  }> {
    return this.findPaginatedRelation(
      () => this.skillRepository.findOccupationsForSkill(modelId, skillId, limit + 1, cursor),
      limit
    );
  }

  async getRelatedSkills(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{
    items: SkillToSkillReferenceWithRelationType<ISkill>[];
    nextCursor: { _id: string; createdAt: Date } | null;
  }> {
    const items = await this.skillRepository.findRelatedSkills(modelId, skillId, limit + 1, cursor);
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    let nextCursor: { _id: string; createdAt: Date } | null = null;
    if (hasMore && pageItems.length > 0) {
      const lastItem = pageItems[pageItems.length - 1] as ISkill & { relationId?: string };
      if (lastItem.relationId) {
        nextCursor = { _id: lastItem.relationId, createdAt: lastItem.createdAt ?? new Date() };
      }
    }

    return { items: pageItems, nextCursor };
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
}
