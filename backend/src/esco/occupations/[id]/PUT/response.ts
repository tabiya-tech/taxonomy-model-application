import { transform } from "../../_shared/transform";
import { IOccupation } from "../../_shared/occupation.types";

export function buildPUTResponse(occupation: IOccupation, baseURL: string) {
  return transform(occupation, baseURL);
}
