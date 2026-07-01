import { ISkillGroupHistoryEntry, ISkillGroupService } from "./skillGroup.service.type";
import { ModelForSkillGroupValidationErrorCode, ISkillGroup, ISkillGroupChild } from "../_shared/skillGroup.types";
import { ISkillGroupRepository } from "../repository/SkillGroup.repository";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillGroupPaginatedFilter } from "./skillGroup.service.type";
import { IModelInfoReference } from "modelInfo/modelInfo.types";

export class SkillGroupService implements ISkillGroupService {
  constructor(private readonly skillGroupRepository: ISkillGroupRepository) {}

  async findById(id: string): Promise<ISkillGroup | null> {
    return this.skillGroupRepository.findById(id);
  }

  async findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc: boolean = true,
    filter?: ISkillGroupPaginatedFilter
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    const sortOrder = desc ? -1 : 1;
    const items = await this.skillGroupRepository.findPaginated(modelId, limit + 1, sortOrder, cursor?.id, filter);
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

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

  async findParents(
    modelId: string,
    id: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    return this.findPaginatedRelation(
      () => this.skillGroupRepository.findParents(modelId, id, limit + 1, cursor),
      limit
    );
  }

  async findChildren(
    modelId: string,
    id: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: ISkillGroupChild[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    return this.findPaginatedRelation(
      () => this.skillGroupRepository.findChildren(modelId, id, limit + 1, cursor),
      limit
    );
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

  async getHistory(skillGroupId: string): Promise<ISkillGroupHistoryEntry[] | null> {
    const skillGroup = await this.skillGroupRepository.findById(skillGroupId);
    if (!skillGroup) {
      return null;
    }

    // The skill group's UUIDHistory holds its OWN past UUIDs (one per model it existed in), newest first.
    // To list the models it appeared in we resolve: UUID -> skill group entity -> its modelId -> model.
    const uuidHistory = skillGroup.UUIDHistory ?? [];
    if (uuidHistory.length === 0) {
      return [];
    }

    const modelRepository = getRepositoryRegistry().modelInfo;

    // Resolve each historical UUID to the modelId of the skill group with that UUID (single query).
    const uuidToModelId = await this.skillGroupRepository.findModelIdsByUUIDs(uuidHistory);
    const modelIdByUUID = new Map(uuidToModelId.map((entry) => [entry.UUID, entry.modelId]));

    // Fetch the full models for the resolved modelIds (single query).
    const modelIds = Array.from(new Set(modelIdByUUID.values()));
    const resolvedModels = modelIds.length > 0 ? await modelRepository.getModelsByIds(modelIds) : [];
    const modelById = new Map(resolvedModels.map((model) => [model.id, model]));

    // Resolve the modelHistory references for every resolved model's own UUIDHistory (single query).
    const allModelHistoryUUIDs = Array.from(new Set(resolvedModels.flatMap((model) => model.UUIDHistory)));
    const references = allModelHistoryUUIDs.length > 0 ? await modelRepository.getHistory(allModelHistoryUUIDs) : [];
    const referenceByUUID = new Map(references.map((reference) => [reference.UUID, reference]));

    // Walk the skill group's UUIDHistory (newest first), skipping UUIDs whose entity or model no longer exists.
    // A given model appears at most once even if multiple history UUIDs map to it.
    const history: ISkillGroupHistoryEntry[] = [];
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
