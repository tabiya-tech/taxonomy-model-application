import { transformDynamicEntity } from "esco/skill/_shared/transform";
import { ISkill } from "esco/skill/_shared/skill.types";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import SkillAPISpecs from "api-specifications/esco/skill";

export function buildParentResponse(
  parent: ISkill | ISkillGroup | null,
  baseURL: string
): SkillAPISpecs.Skill.Parents.POST.Types.Response.Payload {
  if (!parent) return null;
  return transformDynamicEntity(parent, baseURL);
}
