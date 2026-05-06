import { transformDynamicEntity } from "../../../_shared/transform";
import { IOccupation } from "../../../_shared/occupation.types";
import { IOccupationGroup } from "esco/occupationGroup/OccupationGroup.types";

export function buildParentResponse(parent: IOccupation | IOccupationGroup | null, baseURL: string) {
  if (!parent) return null;
  return transformDynamicEntity(parent, baseURL);
}
