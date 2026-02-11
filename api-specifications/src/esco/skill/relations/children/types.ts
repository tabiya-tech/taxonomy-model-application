import SkillEnums from "../../enums";

export interface ISkillChildItem {
  id: string;
  UUID: string;
  preferredLabel: string;
  skillType: SkillEnums.SkillType;
  reuseLevel: SkillEnums.ReuseLevel;
  isLocalized: boolean;
  objectType: "Skill";
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
