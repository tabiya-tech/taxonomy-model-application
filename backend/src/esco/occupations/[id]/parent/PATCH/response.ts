import { transformDynamicEntity } from "esco/occupations/_shared/transform";
import { IOccupation } from "esco/occupations/_shared/occupation.types";
import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";

export function buildParentResponse(parent: IOccupation | IOccupationGroup | null, baseURL: string) {
  if (!parent) return null;
  return transformDynamicEntity(parent, baseURL);
}
