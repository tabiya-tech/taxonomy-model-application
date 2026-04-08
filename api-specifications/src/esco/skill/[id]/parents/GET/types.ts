import type SkillTypes from "../../../_shared/types";
import type SkillGroupTypes from "../../../../skillGroup/_shared/types";

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
