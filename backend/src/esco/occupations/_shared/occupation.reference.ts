import { IBaseOccupationDoc, IOccupationReference, IOccupationReferenceDoc } from "./occupationReference.types";
import mongoose from "mongoose";
import {
  OccupationToSkillReferenceWithRelationType,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { SignallingValueLabel } from "esco/common/objectTypes";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
// the raw hydrated document, before the repository flattens preferredLabel to a string
export type OccupationDocument = _Document<Omit<IBaseOccupationDoc, "preferredLabel">> & {
  preferredLabel: Map<string, string>;
};

export function getOccupationDocReference(occupation: OccupationDocument): IOccupationReferenceDoc {
  return {
    modelId: occupation.modelId,
    id: occupation.id,
    UUID: occupation.UUID,
    occupationGroupCode: occupation.occupationGroupCode,
    code: occupation.code,
    preferredLabel: occupation.preferredLabel.get(getFallbackLanguageConfig().dbKeyName) ?? "",
    occupationType: occupation.occupationType,
    isLocalized: occupation.isLocalized,
  };
}
export function getOccupationReferenceWithRelationType(
  occupation: IOccupationReference,
  relationType: OccupationToSkillRelationType,
  signallingValue?: number | null,
  signallingValueLabel?: SignallingValueLabel
): OccupationToSkillReferenceWithRelationType<IOccupationReference> {
  return {
    ...occupation,
    relationType: relationType,
    signallingValue: signallingValue ?? null,
    signallingValueLabel: signallingValueLabel ?? SignallingValueLabel.NONE,
  };
}
