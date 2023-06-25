import {ObjectTypes, ReferenceWithModelId} from "esco/common/objectTypes";
import {IOccupationDoc, IOccupationReferenceDoc} from "./occupation.types";

export function getOccupationReferenceWithModelId(doc: IOccupationDoc): ReferenceWithModelId<IOccupationReferenceDoc> {
  return {
    modelId: doc.modelId,
    id: doc.id,
    objectType: ObjectTypes.Occupation,
    UUID: doc.UUID,
    ISCOGroupCode: doc.ISCOGroupCode,
    code: doc.code,
    preferredLabel: doc.preferredLabel
  };
}