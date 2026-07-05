import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { IOccupationGroupHistoryEntry } from "esco/occupationGroup/services/occupationGroup.service.type";

export function buildHistoryResponse(
  history: IOccupationGroupHistoryEntry[]
): OccupationGroupAPISpecs.OccupationGroup.History.GET.Types.Response.Payload {
  // Each item is the occupation group's reference fields (as it appeared in a model) flat, plus the stripped model.
  return history.map(({ entity, model }) => ({ ...entity, model }));
}
