import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationGroupDoc, IOccupationGroupReferenceDoc } from "./OccupationGroup.types";
import mongoose from "mongoose";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
export type OccupationGroupDocument = _Document<IOccupationGroupDoc>;

export function getOccupationGroupDocReference(occupationGroup: OccupationGroupDocument): IOccupationGroupReferenceDoc {
  return {
    modelId: occupationGroup.modelId,
    id: occupationGroup.id,
    objectType: ObjectTypes.OccupationGroup,
    UUID: occupationGroup.UUID,
    code: occupationGroup.code,
    preferredLabel: occupationGroup.preferredLabel,
  };
}