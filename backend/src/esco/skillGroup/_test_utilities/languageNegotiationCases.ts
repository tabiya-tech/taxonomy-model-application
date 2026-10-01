import LanguageAPISpecs from "api-specifications/language";

export const FALLBACK_LANGUAGE = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE;
export const SECONDARY_LANGUAGE = LanguageAPISpecs.Constants.Languages.find(
  (language) => language.shortCode !== FALLBACK_LANGUAGE.shortCode
)!;

/** The languages of the model of the language negotiation tests. */
export const MODEL_LANGUAGES = [FALLBACK_LANGUAGE.shortCode, SECONDARY_LANGUAGE.shortCode];

/**
 * The Accept-Language headers a skill group read endpoint is tested with, against a model available in
 * MODEL_LANGUAGES: [description, Accept-Language header (undefined for none), expected language of the response]
 */
export const LANGUAGE_NEGOTIATION_CASES: [string, string | undefined, LanguageAPISpecs.Types.ILanguageConfig][] = [
  ["no Accept-Language header", undefined, FALLBACK_LANGUAGE],
  ["the fallback language", FALLBACK_LANGUAGE.shortCode, FALLBACK_LANGUAGE],
  ["a secondary language of the model", SECONDARY_LANGUAGE.shortCode, SECONDARY_LANGUAGE],
  ["an unsupported language", "zz", FALLBACK_LANGUAGE],
  ["a malformed header", ";;;not-a-language;;;", FALLBACK_LANGUAGE],
  [
    "a quality value header",
    `${FALLBACK_LANGUAGE.shortCode};q=0.5, ${SECONDARY_LANGUAGE.shortCode};q=0.9`,
    SECONDARY_LANGUAGE,
  ],
];

/** The headers of a request that carries the given Accept-Language header, or none when it is undefined. */
export function acceptLanguageHeaders(acceptLanguage: string | undefined): Record<string, string> {
  return acceptLanguage === undefined ? {} : { "Accept-Language": acceptLanguage };
}
