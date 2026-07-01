import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillGroup, ISkillGroupChild, ModelForSkillGroupValidationErrorCode } from "../_shared/skillGroup.types";
import { IModelInfo, IModelInfoReference } from "modelInfo/modelInfo.types";

export interface ISkillGroupPaginatedFilter {
  childrenIds?: string;
  childrenType?: ObjectTypes.Skill | ObjectTypes.SkillGroup;
  root?: boolean;
}

/**
 * A single entry of a skill group's model history: a full ModelInfo together with the resolved
 * details of that model's own UUIDHistory (used to build the modelHistory field of the response).
 */
export interface ISkillGroupHistoryEntry {
  model: IModelInfo;
  modelHistoryDetails: IModelInfoReference[];
}

export interface ISkillGroupService {
  findById(id: string): Promise<ISkillGroup | null>;

  findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc?: boolean,
    filter?: ISkillGroupPaginatedFilter
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  validateModelForSkillGroup(modelId: string): Promise<ModelForSkillGroupValidationErrorCode | null>;

  findParents(
    modelId: string,
    id: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  findChildren(
    modelId: string,
    id: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: ISkillGroupChild[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Resolves the history of the models a SkillGroup appeared in, based on its UUIDHistory.
   * For each UUID in the skill group's UUIDHistory (newest first) that resolves to an existing skill group,
   * returns the full model that skill group belonged to, together with that model's own UUIDHistory details.
   * UUIDs that do not resolve to an existing skill group are skipped, and each model appears at most once.
   *
   * @param {string} skillGroupId - The ID of the SkillGroup.
   * @return {Promise<ISkillGroupHistoryEntry[] | null>} - The resolved history entries in UUIDHistory order,
   * or null if the SkillGroup does not exist.
   */
  getHistory(skillGroupId: string): Promise<ISkillGroupHistoryEntry[] | null>;
}
