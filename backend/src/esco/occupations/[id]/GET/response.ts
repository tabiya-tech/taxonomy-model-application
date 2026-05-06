import { transform } from "../../_shared/transform";
import { IOccupation } from "../../_shared/occupation.types";

export function buildDetailResponse(occupation: IOccupation, baseURL: string) {
  return transform(occupation, baseURL);
}
