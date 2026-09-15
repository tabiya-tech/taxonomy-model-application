import LanguageAPISpecs from "api-specifications/language";
import { getFallbackLanguageConfig } from "./fallbackLanguage";

/**
 * A translated value as it comes out of the database.
 *
 * Mongoose hydrates a translated path as a Map, a lean query and an API payload carry a plain object, both are handled.
 */
export type TranslatedValue = LanguageAPISpecs.Types.ITranslatedString | Map<string, string> | undefined | null;

/**
 * Reads the value of a single language out of a translated value.
 * @param translatedValue the translated value
 * @param language the dbKeyName of the language to read
 * @returns the value of the language, or undefined when the language is not translated
 */
function readLanguage(translatedValue: TranslatedValue, language: string): string | undefined {
  if (translatedValue === undefined || translatedValue === null || typeof language !== "string") {
    return undefined;
  }
  // the language is an arbitrary runtime string, e.g. it comes from the Accept-Language header, so it is looked up as
  // a plain key and the result is narrowed below, instead of being narrowed to a language of the registry up front
  const value =
    translatedValue instanceof Map
      ? translatedValue.get(language)
      : (translatedValue as Record<string, string | undefined>)[language];
  // a language that is translated to an empty value is a language that is not translated
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }
  return value;
}

/**
 * Flattens a translated value to the string of the given language.
 *
 * @param translatedValue the translated value, it may be absent
 * @param language the dbKeyName of the language to resolve to
 * @param fallback the dbKeyName of the language to fall back to, it defaults to the configured fall back language
 * @returns the value of the language, the value of the fall back language when the language is not translated, or an
 *          empty string when neither is translated
 */
export function resolveTranslated(
  translatedValue: TranslatedValue,
  language: string,
  fallback: string = getFallbackLanguageConfig().dbKeyName
): string {
  return readLanguage(translatedValue, language) ?? readLanguage(translatedValue, fallback) ?? "";
}

/**
 * Flattens a list of translated values to the strings of the given language.
 *
 * Every item falls back on its own, an item that is translated in neither the language nor the fall back language is
 * dropped instead of being served as an empty string.
 *
 * @param translatedValues the list of translated values, it may be absent
 * @param language the dbKeyName of the language to resolve to
 * @param fallback the dbKeyName of the language to fall back to, it defaults to the configured fall back language
 * @returns the values of the language, in the order of the list
 */
export function resolveTranslatedArray(
  translatedValues: TranslatedValue[] | undefined | null,
  language: string,
  fallback: string = getFallbackLanguageConfig().dbKeyName
): string[] {
  if (!Array.isArray(translatedValues)) {
    return [];
  }
  return translatedValues
    .map((translatedValue) => resolveTranslated(translatedValue, language, fallback))
    .filter((value) => value.length > 0);
}
