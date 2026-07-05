import OccupationAPISpecs from "api-specifications/esco/occupation";
import { IOccupationHistoryEntry } from "esco/occupations/services/occupation.service.types";

export function buildHistoryResponse(
  history: IOccupationHistoryEntry[]
): OccupationAPISpecs.Occupation.History.GET.Types.Response.Payload {
  // Each item is the occupation's reference fields (as it appeared in a model) flat, plus the stripped model.
  return history.map(({ entity, model }) => ({ ...entity, model }));
}
