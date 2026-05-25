import { transform } from "../_shared/transform";
import { ISkill } from "../_shared/skill.types";
import SkillAPISpecs from "api-specifications/esco/skill";

export function buildGETResponse(
  items: ISkill[],
  baseURL: string,
  limit: number,
  nextCursor: string | null
): SkillAPISpecs.GET.Types.Response.Payload {
  return {
    data: items.map((item) => transform(item, baseURL)),
    limit,
    nextCursor: nextCursor,
  };
}
