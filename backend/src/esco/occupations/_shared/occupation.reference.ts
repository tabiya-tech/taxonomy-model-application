import { IBaseOccupationDoc, IOccupationReference, IOccupationReferenceDoc } from "./occupationReference.types";
import { OCCUPATION_TRANSLATABLE_STRING_FIELDS } from "./occupation.types";
import mongoose from "mongoose";
import {
  OccupationToSkillReferenceWithRelationType,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { SignallingValueLabel } from "esco/common/objectTypes";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { ITranslatedStringDoc } from "common/language/translatedString.types";
import { resolveTranslated, resolveTranslatedArray } from "common/language/resolveTranslated";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
// the raw hydrated document, before the repository flattens preferredLabel to a string
export type OccupationDocument = _Document<Omit<IBaseOccupationDoc, "preferredLabel">> & {
  preferredLabel: ITranslatedStringDoc;
};

/**
 * Flattens all translatable fields of a plain occupation object to the given language, falling back per field.
 * Mutates the object in place and returns it.
 */
export function unwrapOccupationTranslatableFields<T extends object>(occupation: T, language: string): T {
  const target = occupation as Record<string, unknown>;
  const fallback = getFallbackLanguageConfig().dbKeyName;
  for (const field of OCCUPATION_TRANSLATABLE_STRING_FIELDS) {
    if (field in target) {
      target[field] = resolveTranslated(target[field] as ITranslatedStringDoc, language, fallback);
    }
  }
  if (Array.isArray(target.altLabels)) {
    target.altLabels = resolveTranslatedArray(target.altLabels as ITranslatedStringDoc[], language, fallback);
  }
  return occupation;
}

export function getOccupationDocReference(occupation: OccupationDocument, language?: string): IOccupationReferenceDoc {
  const lang = language ?? getFallbackLanguageConfig().dbKeyName;
  return {
    modelId: occupation.modelId,
    id: occupation.id,
    UUID: occupation.UUID,
    occupationGroupCode: occupation.occupationGroupCode,
    code: occupation.code,
    preferredLabel: resolveTranslated(occupation.preferredLabel, lang),
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
