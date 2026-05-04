import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { IOccupationGroup } from "esco/occupationGroup/OccupationGroup.types";
import { transform as transformOccupationGroup } from "esco/occupationGroup/_shared/transform";

export function transform(data: IOccupationGroup, baseURL: string): OccupationGroupAPISpecs.POST.Types.Response.Payload {
  return transformOccupationGroup(data, baseURL);
}
