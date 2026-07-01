import OccupationAPISpecs from "api-specifications/esco/occupation";
import { transform } from "modelInfo/transform";
import { IOccupationHistoryEntry } from "../../../services/occupation.service.types";

export function buildHistoryResponse(
  history: IOccupationHistoryEntry[],
  baseURL: string
): OccupationAPISpecs.Occupation.History.GET.Types.Response.Payload {
  return history.map(({ model, modelHistoryDetails }) => transform(model, baseURL, modelHistoryDetails));
}
