import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillGroup, ISkillGroupChild, ModelForSkillGroupValidationErrorCode } from "../_shared/skillGroup.types";

export interface ISkillGroupPaginatedFilter {
  childrenIds?: string;
  childrenType?: ObjectTypes.Skill | ObjectTypes.SkillGroup;
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
}
