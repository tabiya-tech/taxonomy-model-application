import { type ModelInfo } from "./types";
import { type IModelInfoRow } from "export/modelInfo/modelInfoToCSVTransform";

/**
 * Transforms model information from a CSV row format to a structured parsable format.
 */
export const transformModelInfo = (modelInfo: IModelInfoRow): ModelInfo => {
  // Validate required field name.
  if (!modelInfo.NAME) {
    throw new Error("Model info must contain NAME fields");
  }

  return {
    name: modelInfo.NAME,
    version: modelInfo.VERSION || "unknown",
  };
};
