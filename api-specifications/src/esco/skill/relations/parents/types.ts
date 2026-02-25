import type SkillGroupTypes from "../../../skillGroup/types";
import type SkillTypes from "../../types";

export type ISkillParentItem = SkillTypes.Response.ISkill | SkillGroupTypes.Response.ISkillGroup;

export interface ISkillParentsResponse {
  data: ISkillParentItem[];
  limit: number;
  nextCursor: string | null;
}

export interface ISkillParentsRequestQuery {
  limit?: number;
  cursor?: string;
}
