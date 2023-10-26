import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationDoc, IOccupationReferenceDoc } from "./occupation.types";
import mongoose from "mongoose";

export function getOccupationDocReference(
  occupation: mongoose.Document<unknown, undefined, IOccupationDoc> & IOccupationDoc
): IOccupationReferenceDoc {
  return {
    modelId: occupation.modelId,
    id: occupation.id,
    objectType: ObjectTypes.Occupation,
    UUID: occupation.UUID,
    ISCOGroupCode: occupation.ISCOGroupCode,
    code: occupation.code,
    preferredLabel: occupation.preferredLabel,
  };
}
