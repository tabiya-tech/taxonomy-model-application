import SkillAPISpecs from "api-specifications/esco/skill";
import { ISkillHistoryEntry } from "esco/skill/services/skill.service.types";

export function buildHistoryResponse(
  history: ISkillHistoryEntry[]
): SkillAPISpecs.Skill.History.GET.Types.Response.Payload {
  // Each item is the skill's reference fields (as it appeared in a model) flat, plus the stripped model.
  return history.map(({ entity, model }) => ({ ...entity, model }));
}
