export interface ISkillParentItem {
  id: string;
  UUID: string;
  preferredLabel: string;
  objectType: "SkillGroup" | "Skill";
  code?: string; // Only for SkillGroup parents
  isLocalized?: boolean; // Only for Skill parents
}

export type ISkillParentResponse = ISkillParentItem | null;
