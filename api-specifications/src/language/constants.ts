import LanguageTypes from "./types";

/**
 * The single source of truth for the languages the platform knows about.
 *
 * The registry is a bundled constant. It is compiled into this package and imported by both the backend and the
 * frontend. It is never fetched at runtime and it is not served from the locales bucket.
 *
 * Adding a language is a code change and a release of api-specifications, followed by a rebuild of the backend and
 * the frontend. See ./README.md for the checklist.
 */
namespace LanguageConstants {
  export const NAME_MAX_LENGTH = 256;
  export const SHORT_CODE_MAX_LENGTH = 20;
  export const DB_KEY_NAME_MAX_LENGTH = 20;
  export const CSV_SUFFIX_MAX_LENGTH = 20;

  const ENGLISH = Object.freeze({
    name: "English",
    shortCode: "en",
    dbKeyName: "en",
    csvSuffix: "EN",
  } as const);

  const FRENCH = Object.freeze({
    name: "French",
    shortCode: "fr",
    dbKeyName: "fr",
    csvSuffix: "FR",
  } as const);

  const SPANISH = Object.freeze({
    name: "Spanish",
    shortCode: "es",
    dbKeyName: "es",
    csvSuffix: "ES",
  } as const);

  const PORTUGUESE = Object.freeze({
    name: "Portuguese",
    shortCode: "pt",
    dbKeyName: "pt",
    csvSuffix: "PT",
  } as const);

  const AMHARIC = Object.freeze({
    name: "Amharic",
    shortCode: "am",
    dbKeyName: "am",
    csvSuffix: "AM",
  } as const);

  /**
   * The registry of the supported languages.
   *
   * It is frozen, both the array and every entry, so that no consumer can mutate it at runtime.
   */
  export const Languages = Object.freeze([
    ENGLISH,
    FRENCH,
    SPANISH,
    PORTUGUESE,
    AMHARIC,
  ] as const) satisfies readonly LanguageTypes.ILanguageConfig[];

  /**
   * The language that is used when the client asks for a language that the platform does not know about, or when it
   * does not ask for any language at all.
   *
   * It is an entry of the registry, not a copy of one.
   */
  export const FALLBACK_LANGUAGE = ENGLISH;
}

export default LanguageConstants;
