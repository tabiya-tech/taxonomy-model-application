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

/** The shape findUnsupportedLanguageInPartialSpec needs: the 6 translatable fields, all optional. */
type IPartialTranslatableFieldsSpec = {
  [K in (typeof TRANSLATABLE_FIELDS_FOR_LANGUAGE_CHECK)[number]]?: K extends "altLabels"
    ? LanguageAPISpecs.Types.ITranslatedStringArray
    : LanguageAPISpecs.Types.IPartialTranslatedString;
};

/**
 * Finds the first language, of any translatable field actually present in the partial spec, that is being set
 * (to a non-null value) to a language not in the model's availableLanguages. A field absent from the spec is
 * skipped entirely. Within a present field, a language whose value is null (a deletion) is never flagged,
 * since removing a translation can never introduce an unsupported language. Returns null when every
 * newly-set language is available.
 */
export function findUnsupportedLanguageInPartialSpec(
  spec: IPartialTranslatableFieldsSpec,
  availableLanguages: readonly string[]
): { field: string; language: string } | null {
  for (const field of TRANSLATABLE_FIELDS_FOR_LANGUAGE_CHECK) {
    const value = spec[field];
    if (value === undefined) continue;

    if (field === "altLabels") {
      for (const translated of value as LanguageAPISpecs.Types.ITranslatedStringArray) {
        for (const dbKeyName of Object.keys(translated)) {
          if (!availableLanguages.includes(dbKeyName)) {
            return { field, language: dbKeyName };
          }
        }
      }
      continue;
    }

    const partial = value as LanguageAPISpecs.Types.IPartialTranslatedString;
    for (const [dbKeyName, langValue] of Object.entries(partial)) {
      if (langValue === null) continue;
      if (!availableLanguages.includes(dbKeyName)) {
        return { field, language: dbKeyName };
      }
    }
  }
  return null;
}
