import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { ISkillGroupHistoryEntry } from "esco/skillGroup/services/skillGroup.service.type";

export function buildHistoryResponse(
  history: ISkillGroupHistoryEntry[]
): SkillGroupAPISpecs.SkillGroup.History.GET.Types.Response.Payload {
  // Each item is the skill group's reference fields (as it appeared in a model) flat, plus the stripped model.
  // A skill group's own reference objectType is always SkillGroup; we map the backend enum to the api-spec enum.
  return history.map(({ entity, model }) => ({
    ...entity,
    objectType: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.SkillGroup,
    model,
  }));
}
