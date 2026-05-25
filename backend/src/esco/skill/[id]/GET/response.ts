import * as transformModule from "../../_shared/transform";
import { ISkill } from "../../_shared/skill.types";

export function buildSkillByIdGETResponse(data: ISkill, baseURL: string): ReturnType<typeof transformModule.transform> {
  return transformModule.transform(data, baseURL);
}
