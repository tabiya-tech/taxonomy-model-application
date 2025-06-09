import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { IModelInfoDoc } from "modelInfo/modelInfo.types";
import { IModelInfoRow } from "export/modelInfo/modelInfoToCSVTransform";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

/**
 * Transforms model information from a CSV row format to a structured document format
 *
 * This function converts the flat CSV representation of model metadata into a
 * properly structured IModelInfoDoc object with nested locale information and
 * type-safe field mappings.
 *
 * @param modelInfo - The raw CSV row object containing model metadata
 * @returns The transformed model information document with structured fields
 * @throws Error if required fields are missing or invalid
 */
export const transformModelInfo = (modelInfo: IModelInfoRow): IModelInfoDoc => {
  // Validate required fields
  if (!modelInfo.NAME || !modelInfo.VERSION) {
    throw new Error("Model info must contain NAME and VERSION fields");
  }

  if (!modelInfo.UUIDHISTORY) {
    throw new Error("Model info must contain UUIDHISTORY field");
  }

  try {
    const uuidHistory = arrayFromString(modelInfo.UUIDHISTORY);

    if (uuidHistory.length === 0) {
      throw new Error("UUIDHISTORY cannot be empty");
    }

    return {
      description: modelInfo.DESCRIPTION || "", // Provide default for optional field
      license: "", // License field is not available in CSV, set to empty string
      locale: {
        name: modelInfo.LOCALE || "en", // Default to English if not specified
        UUID: randomUUID(), // Generate new UUID for locale
        shortCode: modelInfo.LOCALE || "en",
      },
      name: modelInfo.NAME,
      UUIDHistory: uuidHistory,
      UUID: uuidHistory[0], // Most recent UUID is first in history
      released: modelInfo.RELEASED?.toLowerCase() === "true", // Safe boolean conversion
      version: modelInfo.VERSION,
      releaseNotes: modelInfo.RELEASENOTES || "", // Provide default for optional field
      importProcessState: new mongoose.Types.ObjectId(), // Generate new ObjectId for import state
    };
  } catch (error) {
    throw new Error(`Failed to transform model info: ${error}`);
  }
};
