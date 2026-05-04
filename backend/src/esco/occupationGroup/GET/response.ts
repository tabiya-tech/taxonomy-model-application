import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { transform as transformOccupationGroup } from "esco/occupationGroup/_shared/transform";

export function transformPaginated(
  data: IOccupationGroup[],
  baseURL: string,
  limit: number,
  cursor: string | null
): OccupationGroupAPISpecs.GET.Types.Response.Payload {
  return {
    data: data.map((item) => transformOccupationGroup(item, baseURL)),
    limit,
    nextCursor: cursor,
  };
}
