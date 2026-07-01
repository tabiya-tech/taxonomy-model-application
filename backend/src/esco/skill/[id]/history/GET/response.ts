import SkillAPISpecs from "api-specifications/esco/skill";
import { transform } from "modelInfo/transform";
import { ISkillHistoryEntry } from "../../../services/skill.service.types";

export function buildHistoryResponse(
  history: ISkillHistoryEntry[],
  baseURL: string
): SkillAPISpecs.Skill.History.GET.Types.Response.Payload {
  return history.map(({ model, modelHistoryDetails }) => transform(model, baseURL, modelHistoryDetails));
}
