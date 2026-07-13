import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { transformParent as transformSkillGroupParent } from "esco/skillGroup/_shared/transform";

export function transformParent(data: ISkillGroup, baseURL: string): ReturnType<typeof transformSkillGroupParent> {
  return transformSkillGroupParent(data, baseURL);
}
