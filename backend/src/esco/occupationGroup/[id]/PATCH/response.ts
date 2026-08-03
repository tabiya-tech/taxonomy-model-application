import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { transform } from "esco/occupationGroup/_shared/transform";

export function buildPATCHResponse(occupationGroup: IOccupationGroup, baseURL: string) {
  return transform(occupationGroup, baseURL);
}
