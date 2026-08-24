import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { transform } from "esco/skillGroup/_shared/transform";

export function buildPUTResponse(skillGroup: ISkillGroup, baseURL: string) {
  return transform(skillGroup, baseURL);
}
