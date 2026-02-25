import SkillEnums from "../../enums";

// This interface represents a skill with relationship metadata
export interface ISkillRelatedItem {
  // Skill properties
  id: string;
  UUID: string;
  preferredLabel: string;
  skillType: SkillEnums.SkillType;
  reuseLevel: SkillEnums.ReuseLevel;
  isLocalized: boolean;

  // Relationship metadata from SkillToSkillRelation
  relationType: SkillEnums.SkillToSkillRelationType;
}

export interface ISkillRelatedResponse {
  data: ISkillRelatedItem[];
  limit: number;
  nextCursor: string | null;
}

export interface ISkillRelatedRequestQuery {
  limit?: number;
  cursor?: string;
}
