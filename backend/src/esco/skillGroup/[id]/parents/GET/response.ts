import { ISkillGroup } from "../../../_shared/skillGroup.types";
import * as transformModule from "../../../_shared/transform";

export function transformPaginatedParents(
  data: ISkillGroup[],
  baseURL: string,
  limit: number | null,
  cursor: string | null
): ReturnType<typeof transformModule.transformPaginatedParents> {
  return transformModule.transformPaginatedParents(data, baseURL, limit, cursor);
}
