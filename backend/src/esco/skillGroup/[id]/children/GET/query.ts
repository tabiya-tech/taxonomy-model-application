import SkillGroupDetailAPISpecs from "api-specifications/esco/skillGroup/[id]";
import { parsePath } from "common/parsePath/parsePath";
import { Routes } from "routes.constant";

export function getSkillGroupChildrenPathParameters(path: string): SkillGroupDetailAPISpecs.Types.Param.Payload {
  return parsePath<SkillGroupDetailAPISpecs.Types.Param.Payload>(Routes.SKILL_GROUP_CHILDREN_ROUTE, path);
}
