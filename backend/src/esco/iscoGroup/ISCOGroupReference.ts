import { ObjectTypes } from "esco/common/objectTypes";
import { IISCOGroupDoc, IISCOGroupReferenceDoc } from "./ISCOGroup.types";
import mongoose from "mongoose";

export function getISCOGroupDocReference(
  iscoGroup: mongoose.Document<unknown, undefined, IISCOGroupDoc> & IISCOGroupDoc
): IISCOGroupReferenceDoc {
  return {
    modelId: iscoGroup.modelId,
    id: iscoGroup.id,
    objectType: ObjectTypes.ISCOGroup,
    UUID: iscoGroup.UUID,
    code: iscoGroup.code,
    preferredLabel: iscoGroup.preferredLabel,
  };
}
