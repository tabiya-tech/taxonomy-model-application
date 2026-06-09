import { transformDynamicEntity } from "esco/skill/_shared/transform";
import { ISkill } from "esco/skill/_shared/skill.types";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";

export function buildParentResponse(parent: ISkill | ISkillGroup | null, baseURL: string) {
  if (!parent) return null;
  return transformDynamicEntity(parent, baseURL);
}
