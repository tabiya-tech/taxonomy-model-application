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

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
// preferredLabel is stored as a localized sub document; ISkillDoc types it as a flat string for callers outside the
// repository, so the raw hydrated document is typed separately here.
export type SkillDocument = Omit<_Document<ISkillDoc>, "preferredLabel"> & {
  preferredLabel: Record<string, string>;
};

// The translatable fields of a Skill, stored as localized sub documents ({ en: "value" }).
const SKILL_TRANSLATABLE_STRING_FIELDS = ["preferredLabel", "description", "definition", "scopeNote"] as const;

export function getSkillDocReference(skill: SkillDocument): ISkillReferenceDoc {
  return {
    modelId: skill.modelId,
    id: skill.id,
    objectType: ObjectTypes.Skill,
    UUID: skill.UUID,
    preferredLabel: readFallbackLanguageValue(skill.preferredLabel, getFallbackLanguageConfig().dbKeyName),
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
