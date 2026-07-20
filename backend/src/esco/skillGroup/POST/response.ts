import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { transform as transformSkillGroup } from "esco/skillGroup/_shared/transform";

export function transform(data: ISkillGroup, baseURL: string): SkillGroupAPISpecs.POST.Types.Response.Payload {
  return transformSkillGroup(data, baseURL);
}
