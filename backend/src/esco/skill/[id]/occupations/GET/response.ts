import * as transformModule from "../../../_shared/transform";

export function buildOccupationsGETResponse(
  data: Parameters<typeof transformModule.transformPaginatedOccupations>[0],
  baseURL: string,
  limit: number,
  cursor: string | null
): ReturnType<typeof transformModule.transformPaginatedOccupations> {
  return transformModule.transformPaginatedOccupations(data, baseURL, limit, cursor);
}
