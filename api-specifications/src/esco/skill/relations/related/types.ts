// This interface represents a skill with relationship metadata
export interface ISkillRelatedItem {
  // Skill properties
  id: string;
  UUID: string;
  preferredLabel: string;
  skillType: "knowledge" | "skill/competence" | "attitude" | "language";
  reuseLevel: "cross-sector" | "sector-specific" | "occupation-specific" | "transversal";
  isLocalized: boolean;

  // Relationship metadata from SkillToSkillRelation
  relationType: string;
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
