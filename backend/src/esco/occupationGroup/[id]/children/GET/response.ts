import { IOccupationGroupChild } from "esco/occupationGroup/OccupationGroup.types";
import { transformPaginatedChildren as transformOccupationGroupPaginatedChildren } from "esco/occupationGroup/_shared/transform";

export function transformPaginatedChildren(
  data: IOccupationGroupChild[],
  baseURL: string,
  limit: number | null,
  cursor: string | null
): ReturnType<typeof transformOccupationGroupPaginatedChildren> {
  return transformOccupationGroupPaginatedChildren(data, baseURL, limit, cursor);
}
