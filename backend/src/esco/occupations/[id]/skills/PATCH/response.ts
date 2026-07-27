import OccupationAPISpecs from "api-specifications/esco/occupation";
import { transform as transformSkill } from "esco/skill/_shared/transform";
import { transformSkillRelationType } from "esco/occupations/_shared/transform";
import { ISkillWithRelation } from "esco/occupations/services/occupation.service.types";

export function transformOccupationSkill(
  skillData: ISkillWithRelation,
  baseURL: string
): OccupationAPISpecs.Occupation.Skills.PATCH.Types.Response.Payload {
  const transformedSkill = transformSkill(skillData, baseURL);
  return {
    ...transformedSkill,
    relationType: transformSkillRelationType(skillData.relationType),
    signallingValue: skillData.signallingValue,
    signallingValueLabel: skillData.signallingValueLabel || null,
  };
}

export function buildSkillsResponse(
  skillData: ISkillWithRelation,
  baseURL: string
): OccupationAPISpecs.Occupation.Skills.PATCH.Types.Response.Payload {
  return transformOccupationSkill(skillData, baseURL);
}
