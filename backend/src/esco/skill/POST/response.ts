import { transform } from "../_shared/transform";
import { ISkill } from "../_shared/skill.types";

export function buildPOSTResponse(skill: ISkill, baseURL: string) {
  return transform(skill, baseURL);
}
