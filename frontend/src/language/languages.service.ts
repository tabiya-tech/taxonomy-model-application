import LanguageAPISpecs from "api-specifications/language";

export type LanguageOption = {
  shortCode: LanguageAPISpecs.Types.LanguageShortCode;
  name: string;
};

/** The language used when nothing else has been selected yet. */
export const DEFAULT_LANGUAGE: LanguageAPISpecs.Types.LanguageShortCode =
  LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;

/**
 * Asks the browser for a language's name written in that language itself, e.g. "français" for "fr".
 * @param shortCode the short code of the language, e.g. "fr"
 * @returns the language's own name, or undefined when the browser cannot provide it
 */
const getOwnLanguageName = (shortCode: string): string | undefined => {
  try {
    const ownName = new Intl.DisplayNames([shortCode], { type: "language" }).of(shortCode);
    // When the browser has no name for the language, it returns the short code unchanged.
    return ownName && ownName !== shortCode ? ownName : undefined;
  } catch {
    // Intl.DisplayNames is missing in older browsers, and it throws for a short code that is not a valid language tag.
    return undefined;
  }
};

/**
 * Resolves a language's human readable name, written in that language itself (e.g. "Français" for "fr"), so that a
 * reader can recognize their own language in a list.
 * @param shortCode the short code to resolve, e.g. "fr"
 * @returns the language's own name, or its registry name when the browser cannot name it, or the short code itself
 * when the registry has no language with that short code
 */
export const getLanguageName = (shortCode: string): string => {
  const registryName = LanguageAPISpecs.Helpers.getLanguageByShortCode(shortCode)?.name;
  if (!registryName) return shortCode;

  const ownName = getOwnLanguageName(shortCode);
  if (!ownName) return registryName;
  // Some languages write their own name in lower case (e.g. "français"), capitalize it to read as a label.
  return ownName.charAt(0).toLocaleUpperCase(shortCode) + ownName.slice(1);
};

/**
 * Resolves a model's available languages into display options, in the model's own order.
 * @param availableLanguages the short codes of the languages a model has
 * @returns the short code and human readable name of each available language that is in the registry
 */
export const getLanguageOptions = (availableLanguages: string[]): LanguageOption[] =>
  availableLanguages.flatMap((shortCode) =>
    LanguageAPISpecs.Helpers.isSupportedLanguage(shortCode) ? [{ shortCode, name: getLanguageName(shortCode) }] : []
  );
