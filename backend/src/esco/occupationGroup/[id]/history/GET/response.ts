import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { transform } from "modelInfo/transform";
import { IOccupationGroupHistoryEntry } from "../../../services/occupationGroup.service.type";

export function buildHistoryResponse(
  history: IOccupationGroupHistoryEntry[],
  baseURL: string
): OccupationGroupAPISpecs.OccupationGroup.History.GET.Types.Response.Payload {
  return history.map(({ model, modelHistoryDetails }) => transform(model, baseURL, modelHistoryDetails));
}
