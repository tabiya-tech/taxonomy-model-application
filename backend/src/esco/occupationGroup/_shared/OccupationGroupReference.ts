import { IOccupationGroupDoc, IOccupationGroupReferenceDoc } from "./OccupationGroup.types";
import mongoose from "mongoose";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { resolveTranslated, resolveTranslatedArray } from "common/language/resolveTranslated";
import { ITranslatedStringDoc } from "common/language/translatedString.types";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
// the raw hydrated document: its translatable paths are localized sub documents, not the flat strings the
// repository hands back
export type OccupationGroupDocument = _Document<IOccupationGroupDoc>;

export function getOccupationGroupDocReference(
  occupationGroup: OccupationGroupDocument,
  language?: string
): IOccupationGroupReferenceDoc {
  const lang = language ?? getFallbackLanguageConfig().dbKeyName;
  return {
    modelId: occupationGroup.modelId,
    id: occupationGroup.id,
    objectType: occupationGroup.groupType,
    UUID: occupationGroup.UUID,
    code: occupationGroup.code,
    preferredLabel: resolveTranslated(occupationGroup.preferredLabel, lang),
  };
}

/**
 * Flattens all translatable fields of a plain OccupationGroup object to the given language, falling back per field.
 * Mutates the object in place and returns it.
 */
export function unwrapOccupationGroupTranslatableFields<T extends object>(occupationGroup: T, language: string): T {
  const target = occupationGroup as Record<string, unknown>;
  const fallback = getFallbackLanguageConfig().dbKeyName;
  for (const field of ["preferredLabel", "description"] as const) {
    if (field in target) {
      target[field] = resolveTranslated(target[field] as ITranslatedStringDoc, language, fallback);
    }
  }
  if (Array.isArray(target.altLabels)) {
    target.altLabels = resolveTranslatedArray(target.altLabels as ITranslatedStringDoc[], language, fallback);
  }
  return occupationGroup;
}
