import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { ISkillDoc, ISkillReference, ISkillReferenceDoc } from "../_shared/skill.types";
import mongoose from "mongoose";
import {
  SkillToSkillReferenceWithRelationType,
  SkillToSkillRelationType,
} from "esco/skillToSkillRelation/skillToSkillRelation.types";
import {
  OccupationToSkillReferenceWithRelationType,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { readFallbackLanguageValue, readFallbackLanguageValues } from "common/language/translatedFields";
import { ITranslatedStringDoc } from "common/language/translatedString.types";
import { resolveTranslated, resolveTranslatedArray } from "common/language/resolveTranslated";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
// preferredLabel is stored as a translated sub document; ISkillDoc types it as a flat string for callers outside the
// repository, so the raw hydrated document is typed separately here.
export type SkillDocument = Omit<_Document<ISkillDoc>, "preferredLabel"> & {
  preferredLabel: ITranslatedStringDoc;
};

// The translatable fields of a Skill, stored as translated sub documents ({ en: "value" }).
const SKILL_TRANSLATABLE_STRING_FIELDS = ["preferredLabel", "description", "definition", "scopeNote"] as const;

export function getSkillDocReference(skill: SkillDocument, language?: string): ISkillReferenceDoc {
  const lang = language ?? getFallbackLanguageConfig().dbKeyName;
  return {
    modelId: skill.modelId,
    id: skill.id,
    objectType: ObjectTypes.Skill,
    UUID: skill.UUID,
    preferredLabel: readFallbackLanguageValue(skill.preferredLabel, lang),
    isLocalized: skill.isLocalized,
  };
}

/**
 * Flattens the translatable fields of a plain Skill object back to the fallback language's string, the shape
 * ISkill/ISkillDoc expect. Used by SkillRepository and by other repositories that read a Skill document directly.
 */
export function unwrapSkillTranslatableFields<T extends object>(plainSkill: T): T {
  const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  const target = plainSkill as Record<string, unknown>;
  SKILL_TRANSLATABLE_STRING_FIELDS.forEach((field) => {
    if (field in target) {
      target[field] = readFallbackLanguageValue(target[field], fallbackDbKeyName);
    }
  });
  if (Array.isArray(target.altLabels)) {
    target.altLabels = readFallbackLanguageValues(target.altLabels, fallbackDbKeyName);
  }
  return plainSkill;
}

/**
 * Flattens the translatable fields of a plain Skill object to the given language, falling back per field.
 * Used when reading skills in the context of a language-aware request.
 */
export function unwrapSkillTranslatableFieldsForLanguage<T extends object>(plainSkill: T, language: string): T {
  const fallback = getFallbackLanguageConfig().dbKeyName;
  const target = plainSkill as Record<string, unknown>;
  SKILL_TRANSLATABLE_STRING_FIELDS.forEach((field) => {
    if (field in target) {
      target[field] = resolveTranslated(target[field] as ITranslatedStringDoc, language, fallback);
    }
  });
  if (Array.isArray(target.altLabels)) {
    target.altLabels = resolveTranslatedArray(target.altLabels as ITranslatedStringDoc[], language, fallback);
  }
  return plainSkill;
}

export function getSkillReferenceWithRelationType(
  skill: ISkillReference,
  relationType: SkillToSkillRelationType | OccupationToSkillRelationType,
  signallingValue?: number | null,
  signallingValueLabel?: SignallingValueLabel
):
  | SkillToSkillReferenceWithRelationType<ISkillReference>
  | OccupationToSkillReferenceWithRelationType<ISkillReference> {
  return {
    ...skill,
    relationType: relationType,
    signallingValue: signallingValue ?? null,
    signallingValueLabel: signallingValueLabel ?? SignallingValueLabel.NONE,
  };
}
