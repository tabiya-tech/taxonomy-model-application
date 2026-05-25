import * as transformModule from "../../../_shared/transform";

export function buildParentsGETResponse(
  data: Parameters<typeof transformModule.transformPaginatedRelation>[0],
  baseURL: string,
  limit: number,
  cursor: string | null
): ReturnType<typeof transformModule.transformPaginatedRelation> {
  return transformModule.transformPaginatedRelation(data, baseURL, limit, cursor);
}
