import { getFallbackLanguageConfig } from "./fallbackLanguage";
import { ITranslatedStringArrayDoc, ITranslatedStringDoc, TranslatedStringKey } from "./translatedString.types";
import LanguageAPISpecs from "api-specifications/language";

/**
 * Reads the value a plain object carries under a key, or undefined when the value is not a plain object.
 * An array is not a plain object here: a list of translated values is read item by item, never as a whole.
 */
function readPlainObjectKey(value: unknown, key: string): unknown {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return (value as Record<string, unknown>)[key];
  }
  return undefined;
}

/**
 * Reads the value of the fall back language out of a translated value, as it is stored.
 *
 * The value is returned as-is, including when it is empty or whitespace only: resolveTranslated() is not used here
 * because it swaps an empty value for the value of the fall back language, and this already reads the fall back
 * language.
 *
 * @param translatedValue the translated value, a Map for a Map path, a plain object for a Mixed path, or a flat
 *                        string for a document that predates the localized fields migration
 * @param fallbackDbKeyName the dbKeyName of the fall back language
 * @returns the value of the fall back language, or an empty string when the fall back language is not translated
 */
export function readFallbackLanguageValue(translatedValue: unknown, fallbackDbKeyName: string): string {
  // a Mixed path is not coerced on read, so a document written before the localized fields migration still hydrates
  // as a flat string; pass it through as-is rather than discarding it as empty
  if (typeof translatedValue === "string") {
    return translatedValue;
  }
  const value =
    translatedValue instanceof Map
      ? translatedValue.get(fallbackDbKeyName)
      : readPlainObjectKey(translatedValue, fallbackDbKeyName);
  return typeof value === "string" ? value : "";
}

/**
 * Reads the values of the fall back language out of a list of translated values.
 *
 * An item that is not translated in the fall back language is read as an empty string rather than being dropped, so
 * that the list keeps its length and its order.
 *
 * @param translatedValues the list of translated values, absent on a document that never carried the path
 * @param fallbackDbKeyName the dbKeyName of the fall back language
 * @returns the values of the fall back language, an empty list when there is no list to read
 */
export function readFallbackLanguageValues(translatedValues: unknown, fallbackDbKeyName: string): string[] {
  if (!Array.isArray(translatedValues)) {
    return [];
  }
  return translatedValues.map((item: unknown) => readFallbackLanguageValue(item, fallbackDbKeyName));
}

/**
 * Wraps a flat string into a translated value keyed by the fall back language, e.g. "Cook" into { en: "Cook" }.
 */
export function wrapTranslated(value: string): ITranslatedStringDoc {
  return new Map([[getFallbackLanguageConfig().dbKeyName as TranslatedStringKey, value]]);
}

/**
 * Wraps a list of flat strings into a list of translated values keyed by the fall back language.
 */
export function wrapTranslatedArray(values: string[]): ITranslatedStringArrayDoc {
  return values.map(wrapTranslated);
}

/**
 * Reads the translations a stored path already carries.
 *
 * A hydrated path is a Map, but a lean query and a document written before the localized fields migration hand over
 * a plain object, so both are read. The path is absent on a brand new, unsaved document, and carries a flat string
 * on a document that predates the migration; neither is a set of translations, so both read as none.
 *
 * @param storedValue the value of the path, as it is hydrated
 * @returns the translations, keyed by the dbKeyName of their language
 */
export function readExistingTranslations(storedValue: unknown): ITranslatedStringDoc {
  if (storedValue instanceof Map) {
    return new Map(storedValue);
  }
  if (typeof storedValue === "object" && storedValue !== null && !Array.isArray(storedValue)) {
    return new Map(Object.entries(storedValue) as [TranslatedStringKey, string][]);
  }
  return new Map();
}

/**
 * Wraps the translatable fields of a create/update spec into translated values keyed by the fall back language.
 *
 * The fall back language is merged into the translations the document already carries, since mongoose replaces, and
 * does not merge, the value of a path on .set(). altLabels has no stable per item identity to merge by, so it is
 * replaced wholesale instead.
 *
 * @param spec the create/update spec, its translatable fields still flat strings
 * @param translatableStringFields the fields of the spec that carry a single translated value
 * @param existingDoc the document being updated, absent when the entity is being created
 * @returns the spec, with its translatable fields wrapped
 */
export function wrapTranslatableFields<Field extends string>(
  spec: Partial<Record<Field, string>> & { altLabels?: string[] },
  translatableStringFields: readonly Field[],
  existingDoc?: object
): Record<string, unknown> {
  const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  const wrapped: Record<string, unknown> = { ...spec };
  translatableStringFields.forEach((field) => {
    const value = spec[field];
    if (value !== undefined) {
      const translations = existingDoc
        ? readExistingTranslations((existingDoc as Record<string, unknown>)[field])
        : new Map<TranslatedStringKey, string>();
      wrapped[field] = translations.set(fallbackDbKeyName as TranslatedStringKey, value);
    }
  });
  if (spec.altLabels !== undefined) {
    wrapped.altLabels = wrapTranslatedArray(spec.altLabels);
  }
  return wrapped;
}

/**
 * Wraps a full multilingual object into a translated value, keyed by every language it carries, e.g.
 * { en: "Cook", fr: "Cuisinier" } into a Map with both keys.
 */
export function wrapTranslatedFromObject(value: LanguageAPISpecs.Types.ITranslatedString): ITranslatedStringDoc {
  return new Map(Object.entries(value) as [TranslatedStringKey, string][]);
}

/**
 * Wraps a list of multilingual objects into a list of translated values.
 */
export function wrapTranslatedArrayFromObjects(
  values: LanguageAPISpecs.Types.ITranslatedStringArray
): ITranslatedStringArrayDoc {
  return values.map(wrapTranslatedFromObject);
}

/**
 * Wraps the translatable fields of a spec, already full multilingual objects, into translated values,
 * replacing whatever the field previously held.
 *
 * Used by create (a new document has nothing to merge into) and by PUT's full replace (every language of
 * the input becomes the new set of keys; a language absent from the input is dropped). Unlike
 * wrapTranslatableFields, there is no existingDoc to merge into — the caller is expected to want a full
 * replace.
 *
 * @param spec the spec, its translatable fields full multilingual objects
 * @param translatableStringFields the fields of the spec that carry a translated value
 * @returns the spec, with its translatable fields wrapped
 */
export function wrapTranslatableFieldsFromObjects<Field extends string>(
  spec: Partial<Record<Field, LanguageAPISpecs.Types.ITranslatedString>> & {
    altLabels?: LanguageAPISpecs.Types.ITranslatedStringArray;
  },
  translatableStringFields: readonly Field[]
): Record<string, unknown> {
  const wrapped: Record<string, unknown> = { ...spec };
  translatableStringFields.forEach((field) => {
    const value = spec[field];
    if (value !== undefined) {
      wrapped[field] = wrapTranslatedFromObject(value);
    }
  });
  if (spec.altLabels !== undefined) {
    wrapped.altLabels = wrapTranslatedArrayFromObjects(spec.altLabels);
  }
  return wrapped;
}
