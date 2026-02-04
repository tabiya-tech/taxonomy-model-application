export interface ISkillChildItem {
  id: string;
  UUID: string;
  preferredLabel: string;
  skillType: "knowledge" | "skill/competence" | "attitude" | "language";
  reuseLevel: "cross-sector" | "sector-specific" | "occupation-specific" | "transversal";
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
