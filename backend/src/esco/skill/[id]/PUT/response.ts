import { transform } from "../../_shared/transform";
import { ISkill } from "../../_shared/skill.types";

export function buildPUTResponse(skill: ISkill, baseURL: string) {
  return transform(skill, baseURL);
}
