import { ISkillHistoryEntry, ISkillService, SkillModelValidationError } from "./skill.service.types";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { toModelReference } from "modelInfo/modelInfoReference";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { ISkill, INewSkillSpecWithoutImportId, ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";

export class SkillService implements ISkillService {
  constructor(
    private readonly skillRepository: ISkillRepository,
    private readonly modelRepository: IModelRepository
  ) {}

  async create(newSkillSpec: INewSkillSpecWithoutImportId): Promise<ISkill> {
    const errorCode = await this.validateModelForSkill(newSkillSpec.modelId);
    if (errorCode != null) {
      throw new SkillModelValidationError(errorCode);
    }

    return await this.skillRepository.create(newSkillSpec);
  }

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

  async getHistory(skillId: string): Promise<ISkillHistoryEntry[] | null> {
    const skill = await this.skillRepository.findById(skillId);
    if (!skill) {
      return null;
    }

    // The skill's UUIDHistory holds the skill's OWN past UUIDs (one per model it existed in), newest first.
    // To list the models it appeared in we resolve: UUID -> skill entity -> its modelId -> model.
    const uuidHistory = skill.UUIDHistory ?? [];
    if (uuidHistory.length === 0) {
      return [];
    }

    // Resolve each historical UUID to the skill's reference (as it was in that model) + its modelId.
    const historyReferences = await this.skillRepository.findHistoryReferencesByUUIDs(uuidHistory);
    const referenceByUUID = new Map(historyReferences.map((entry) => [entry.UUID, entry]));

    // Fetch the models for the resolved modelIds (single query) and map them to lightweight references.
    const modelIds = Array.from(
      new Set(historyReferences.map((entry) => entry.modelId).filter((id): id is string => id !== null))
    );
    const resolvedModels = modelIds.length > 0 ? await this.modelRepository.getModelsByIds(modelIds) : [];
    const modelById = new Map(resolvedModels.map((model) => [model.id, model]));

    // Walk the skill's UUIDHistory (newest first), skipping UUIDs whose skill or model no longer exists.
    // A given model appears at most once even if multiple history UUIDs map to it.
    const history: ISkillHistoryEntry[] = [];
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
