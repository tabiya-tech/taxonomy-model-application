import { transformSkillRelated } from "esco/skill/_shared/transform";
import { ISkill } from "esco/skill/_shared/skill.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import SkillAPISpecs from "api-specifications/esco/skill";

export function buildRelatedResponse(
  skillData: SkillToSkillReferenceWithRelationType<ISkill> | null | undefined,
  baseURL: string
): SkillAPISpecs.Skill.RelatedSkills.GET.Types.Response.Payload["data"][0] | null {
  if (!skillData) return null;
  return transformSkillRelated(skillData, baseURL);
}
