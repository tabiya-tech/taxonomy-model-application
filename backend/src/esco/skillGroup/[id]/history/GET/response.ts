import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { transform } from "modelInfo/transform";
import { ISkillGroupHistoryEntry } from "../../../services/skillGroup.service.type";

export function buildHistoryResponse(
  history: ISkillGroupHistoryEntry[],
  baseURL: string
): SkillGroupAPISpecs.SkillGroup.History.GET.Types.Response.Payload {
  return history.map(({ model, modelHistoryDetails }) => transform(model, baseURL, modelHistoryDetails));
}
