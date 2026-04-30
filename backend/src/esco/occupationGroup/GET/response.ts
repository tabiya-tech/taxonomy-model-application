import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { transform } from "esco/occupationGroup/[id]/GET/response";

export function transformPaginated(
  data: IOccupationGroup[],
  baseURL: string,
  limit: number,
  cursor: string | null
): OccupationGroupAPISpecs.GET.Types.Response.Payload {
  return {
    data: data.map((item) => transform(item, baseURL)),
    limit,
    nextCursor: cursor,
  };
}
