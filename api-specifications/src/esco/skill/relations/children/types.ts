import SkillEnums from "../../enums";
import { ObjectTypes } from "./enums";

export interface ISkillChildItem {
  id: string;
  UUID: string;
  preferredLabel: string;
  objectType: ObjectTypes.Skill | ObjectTypes.SkillGroup;
  /**  Present only when objectType === SkillGroup */
  code?: string;
  /** Present only when objectType === Skill */
  skillType?: SkillEnums.SkillType;
  reuseLevel?: SkillEnums.ReuseLevel;
  isLocalized?: boolean;
}

export interface ISkillChildrenResponse {
  data: ISkillChildItem[];
  limit: number;
  nextCursor: string | null;
}

export interface ISkillChildrenRequestQuery {
  limit?: number;
  cursor?: string;
}
