import { transformDynamicEntity } from "../../../_shared/transform";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { IOccupation } from "../../../_shared/occupation.types";
import { IOccupationGroup } from "esco/occupationGroup/OccupationGroup.types";

export function buildChildrenResponse(
  items: (IOccupation | IOccupationGroup)[],
  baseURL: string,
  limit: number,
  nextCursor: string | null
): {
  data: (OccupationAPISpecs.Types.Response.IOccupation | OccupationGroupAPISpecs.Types.Response.IOccupationGroup)[];
  limit: number;
  nextCursor: string | null;
} {
  return {
    data: items.map((item) => transformDynamicEntity(item, baseURL)),
    limit,
    nextCursor: nextCursor,
  };
}
