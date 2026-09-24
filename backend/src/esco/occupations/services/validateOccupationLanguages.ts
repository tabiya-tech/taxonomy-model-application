import LanguageAPISpecs from "api-specifications/language";

/** The translatable fields of a create or update spec that may carry a multilingual object. */
const TRANSLATABLE_FIELDS_FOR_LANGUAGE_CHECK = [
  "preferredLabel",
  "altLabels",
  "description",
  "definition",
  "scopeNote",
  "regulatedProfessionNote",
] as const;

/** The shape findUnsupportedLanguage needs: just the 6 translatable fields, whatever spec they come from. */
type ITranslatableFieldsSpec = {
  [K in (typeof TRANSLATABLE_FIELDS_FOR_LANGUAGE_CHECK)[number]]: K extends "altLabels"
    ? LanguageAPISpecs.Types.ITranslatedStringArray
    : LanguageAPISpecs.Types.ITranslatedString;
};

/**
 * Finds the first language, of any translatable field of the spec, that is not in the model's
 * availableLanguages. Returns null when every language used is available.
 */
export function findUnsupportedLanguage(
  spec: ITranslatableFieldsSpec,
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
