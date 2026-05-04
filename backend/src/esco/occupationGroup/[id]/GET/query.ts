import OccupationGroupDetailAPISpecs from "api-specifications/esco/occupationGroup/[id]";
import { parsePath } from "common/parsePath/parsePath";
import { Routes } from "routes.constant";

export function getOccupationGroupDetailPathParameters(path: string): OccupationGroupDetailAPISpecs.Types.Param.Payload {
  return parsePath<OccupationGroupDetailAPISpecs.Types.Param.Payload>(Routes.OCCUPATION_GROUP_ROUTE, path);
}
