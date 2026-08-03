import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { transform } from "esco/occupationGroup/_shared/transform";

export function buildPUTResponse(occupationGroup: IOccupationGroup, baseURL: string) {
  return transform(occupationGroup, baseURL);
}
