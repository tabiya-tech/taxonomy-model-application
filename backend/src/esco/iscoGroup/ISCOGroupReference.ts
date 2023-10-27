import { ObjectTypes } from "esco/common/objectTypes";
import { IISCOGroupDoc, IISCOGroupReferenceDoc } from "./ISCOGroup.types";
import mongoose from "mongoose";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
export type ISCOGroupDocument = _Document<IISCOGroupDoc>;

export function getISCOGroupDocReference(iscoGroup: ISCOGroupDocument): IISCOGroupReferenceDoc {
  return {
    modelId: iscoGroup.modelId,
    id: iscoGroup.id,
    objectType: ObjectTypes.ISCOGroup,
    UUID: iscoGroup.UUID,
    code: iscoGroup.code,
    preferredLabel: iscoGroup.preferredLabel,
  };
}
