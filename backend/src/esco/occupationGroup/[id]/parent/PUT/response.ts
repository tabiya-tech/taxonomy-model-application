import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { transformParent as transformOccupationGroupParent } from "esco/occupationGroup/_shared/transform";

export function transformParent(
  data: IOccupationGroup,
  baseURL: string
): ReturnType<typeof transformOccupationGroupParent> {
  return transformOccupationGroupParent(data, baseURL);
}
