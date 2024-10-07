import {
  IBaseOccupationDoc,
  IOccupationReference,
  IOccupationReferenceDoc,
} from "esco/occupations/occupationReference.types";
import mongoose from "mongoose";
import {
  OccupationToSkillReferenceWithRelationType,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
export type OccupationDocument = _Document<IBaseOccupationDoc>;

export function getOccupationDocReference(occupation: OccupationDocument): IOccupationReferenceDoc {
  return {
    modelId: occupation.modelId,
    id: occupation.id,
    UUID: occupation.UUID,
    occupationGroupCode: occupation.occupationGroupCode,
    code: occupation.code,
    preferredLabel: occupation.preferredLabel,
    occupationType: occupation.occupationType,
    isLocalized: occupation.isLocalized,
  };
}
export function getOccupationReferenceWithRelationType(
  occupation: IOccupationReference,
  relationType: OccupationToSkillRelationType
): OccupationToSkillReferenceWithRelationType<IOccupationReference> {
  return {
    ...occupation,
    relationType: relationType,
  };
}
