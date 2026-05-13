import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { ISkillGroup } from "../../_shared/skillGroup.types";
import * as transformModule from "../../_shared/transform";

export function transform(data: ISkillGroup, baseURL: string): SkillGroupAPISpecs.Types.Response.ISkillGroup {
  return transformModule.transform(data, baseURL);
}
