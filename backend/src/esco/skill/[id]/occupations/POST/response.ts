import { transformSkillOccupation } from "esco/skill/_shared/transform";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import SkillAPISpecs from "api-specifications/esco/skill";

export function buildOccupationsResponse(
  occupationData: OccupationToSkillReferenceWithRelationType<IOccupationReference>,
  baseURL: string
): SkillAPISpecs.Skill.Occupations.GET.Types.Response.Payload["data"][0] {
  return transformSkillOccupation(occupationData, baseURL);
}
