import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { IModelInfoDoc } from "modelInfo/modelInfo.types";
import { IModelInfoRow } from "export/modelInfo/modelInfoToCSVTransform";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

/**
 * Transforms model information from a CSV row format to a structured TS format.
 *
 * @param {IModelInfoRow} modelInfo - The raw CSV row object, typically retrieved from a CSV file.
 * @returns {IModelInfoDoc} The transformed model information document with structured fields.
 */
export const transformModelInfo = (modelInfo: IModelInfoRow): IModelInfoDoc => {
  return {
    description: modelInfo.DESCRIPTION,
    license: "",
    locale: {
      name: modelInfo.LOCALE,
      UUID: randomUUID(),
      shortCode: modelInfo.LOCALE,
    },
    name: modelInfo.NAME,
    UUIDHistory: arrayFromString(modelInfo.UUIDHISTORY),
    UUID: arrayFromString(modelInfo.UUIDHISTORY)[0],
    released: modelInfo.RELEASED == "true",
    version: modelInfo.VERSION,
    releaseNotes: modelInfo.RELEASENOTES,
    importProcessState: new mongoose.Types.ObjectId(),
  };
};
