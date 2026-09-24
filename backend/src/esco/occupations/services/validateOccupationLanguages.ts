import LanguageAPISpecs from "api-specifications/language";
import { INewOccupationSpecWithoutImportId } from "../_shared/occupation.types";

/** The translatable fields of a create spec that may carry a multilingual object. */
const TRANSLATABLE_FIELDS_FOR_LANGUAGE_CHECK = [
  "preferredLabel",
  "altLabels",
  "description",
  "definition",
  "scopeNote",
  "regulatedProfessionNote",
] as const;

/**
 * Finds the first language, of any translatable field of the spec, that is not in the model's
 * availableLanguages. Returns null when every language used is available.
 */
export function findUnsupportedLanguage(
  spec: INewOccupationSpecWithoutImportId,
  availableLanguages: readonly string[]
): { field: string; language: string } | null {
  for (const field of TRANSLATABLE_FIELDS_FOR_LANGUAGE_CHECK) {
    const translatedObjects: LanguageAPISpecs.Types.ITranslatedString[] =
      field === "altLabels" ? spec.altLabels : [spec[field]];
    for (const translated of translatedObjects) {
      for (const dbKeyName of Object.keys(translated)) {
        if (!availableLanguages.includes(dbKeyName)) {
          return { field, language: dbKeyName };
        }
      }
    }
  }
  return null;
}
