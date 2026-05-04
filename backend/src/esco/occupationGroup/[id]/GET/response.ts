import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { transform as transformOccupationGroup } from "esco/occupationGroup/_shared/transform";

export function transform(
  data: IOccupationGroup,
  baseURL: string
): OccupationGroupAPISpecs.Types.Response.IOccupationGroup {
  return transformOccupationGroup(data, baseURL);
}
