import { ISkillGroupChild } from "../../../_shared/skillGroup.types";
import * as transformModule from "../../../_shared/transform";

export function transformPaginatedChildren(
  data: ISkillGroupChild[],
  baseURL: string,
  limit: number | null,
  cursor: string | null
): ReturnType<typeof transformModule.transformPaginatedChildren> {
  return transformModule.transformPaginatedChildren(data, baseURL, limit, cursor);
}
