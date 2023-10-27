import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationDoc, IOccupationReferenceDoc } from "./occupation.types";
import mongoose from "mongoose";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
export type OccupationDocument = _Document<IOccupationDoc>;

export function getOccupationDocReference(occupation: OccupationDocument): IOccupationReferenceDoc {
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
