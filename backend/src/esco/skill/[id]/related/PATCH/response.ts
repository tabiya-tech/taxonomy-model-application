import { transformSkillRelated } from "esco/skill/_shared/transform";
import { ISkill } from "esco/skill/_shared/skill.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import SkillAPISpecs from "api-specifications/esco/skill";

export function buildRelatedResponse(
  skillData: SkillToSkillReferenceWithRelationType<ISkill>,
  baseURL: string
): SkillAPISpecs.Skill.RelatedSkills.PATCH.Types.Response.Payload {
  return transformSkillRelated(skillData, baseURL);
}
