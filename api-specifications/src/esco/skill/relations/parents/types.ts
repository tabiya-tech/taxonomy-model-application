export interface ISkillParentItem {
  id: string;
  UUID: string;
  preferredLabel: string;
  objectType: "SkillGroup" | "Skill";
  code?: string; // Only for SkillGroup parents
  isLocalized?: boolean; // Only for Skill parents
}

export interface ISkillParentsResponse {
  data: ISkillParentItem[];
  limit: number;
  nextCursor: string | null;
}

export type ISkillParentResponse = ISkillParentsResponse;

export interface ISkillParentsRequestQuery {
  limit?: number;
  cursor?: string;
}
