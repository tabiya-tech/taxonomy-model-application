import * as transformModule from "../../../_shared/transform";

export function buildRelatedGETResponse(
  data: Parameters<typeof transformModule.transformPaginatedRelated>[0],
  baseURL: string,
  limit: number,
  cursor: string | null
): ReturnType<typeof transformModule.transformPaginatedRelated> {
  return transformModule.transformPaginatedRelated(data, baseURL, limit, cursor);
}
