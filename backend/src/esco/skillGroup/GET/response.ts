import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { ISkillGroup } from "../_shared/skillGroup.types";
import * as transformModule from "../_shared/transform";

export function transformPaginated(
  data: ISkillGroup[],
  baseURL: string,
  limit: number,
  cursor: string | null
): SkillGroupAPISpecs.Types.GET.Response.Payload {
  return transformModule.transformPaginated(data, baseURL, limit, cursor);
}
