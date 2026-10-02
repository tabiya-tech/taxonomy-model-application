import LanguageAPISpecs from "api-specifications/language";

export type LanguageOption = {
  shortCode: string;
  name: string;
};

/** The language used when nothing else has been selected yet. */
export const DEFAULT_LANGUAGE: string = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;

/**
 * Resolves a language's human readable name from the registry.
 * @param shortCode the short code to resolve, e.g. "fr"
 * @returns the language's name, or the short code itself when the registry has no language with that short code
 */
export const getLanguageName = (shortCode: string): string =>
  LanguageAPISpecs.Helpers.getLanguageByShortCode(shortCode)?.name ?? shortCode;

/**
 * Resolves a model's available languages into display options, in the model's own order.
 * @param availableLanguages the short codes of the languages a model has
 * @returns the short code and human readable name of each available language
 */
export const getLanguageOptions = (availableLanguages: string[]): LanguageOption[] =>
  availableLanguages.map((shortCode) => ({ shortCode, name: getLanguageName(shortCode) }));
