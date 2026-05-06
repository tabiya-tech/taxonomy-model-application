import OccupationAPISpecs from "api-specifications/esco/occupation";
import { transform as transformSkill } from "esco/skill/transform";
import { transformSkillRelationType } from "../../../_shared/transform";
import { ISkillWithRelation } from "../../../services/occupation.service.types";

export function transformOccupationSkill(
  skillData: ISkillWithRelation,
  baseURL: string
): OccupationAPISpecs.Occupation.Skills.GET.Types.Response.SkillItem {
  const transformedSkill = transformSkill(skillData, baseURL);
  return {
    ...transformedSkill,
    relationType: transformSkillRelationType(skillData.relationType),
    signallingValue: skillData.signallingValue,
    signallingValueLabel: skillData.signallingValueLabel || null,
  };
}

export function buildSkillsResponse(
  items: ISkillWithRelation[],
  baseURL: string,
  limit: number,
  nextCursor: string | null
): OccupationAPISpecs.Occupation.Skills.GET.Types.Response.Payload {
  return {
    data: items.map((item) => transformOccupationSkill(item, baseURL)),
    limit,
    nextCursor: nextCursor,
  };
}
