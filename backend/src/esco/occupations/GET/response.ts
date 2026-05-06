import { transform } from "../_shared/transform";
import { IOccupation } from "../_shared/occupation.types";
import OccupationAPISpecs from "api-specifications/esco/occupation";

export function buildGETResponse(
  items: IOccupation[],
  baseURL: string,
  limit: number,
  nextCursor: string | null
): OccupationAPISpecs.GET.Types.Response.Payload {
  return {
    data: items.map((item) => transform(item, baseURL)),
    limit,
    nextCursor: nextCursor,
  };
}
