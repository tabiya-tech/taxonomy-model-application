import { ReferenceWithRelationType, RelationType } from "esco/common/objectTypes";
import {
  IBaseOccupationDoc,
  IOccupationReference,
  IOccupationReferenceDoc,
} from "esco/occupations/common/occupationReference.types";
import mongoose from "mongoose";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
export type OccupationDocument = _Document<IBaseOccupationDoc>;

export function getOccupationDocReference(occupation: OccupationDocument): IOccupationReferenceDoc {
  return {
    modelId: occupation.modelId,
    id: occupation.id,
    UUID: occupation.UUID,
    ISCOGroupCode: occupation.ISCOGroupCode,
    code: occupation.code,
    preferredLabel: occupation.preferredLabel,
    occupationType: occupation.occupationType,
  };
}
export function getOccupationReferenceWithRelationType(
  occupation: IOccupationReference,
  relationType: RelationType
): ReferenceWithRelationType<IOccupationReference> {
  return {
    ...occupation,
    relationType: relationType,
  };
}
