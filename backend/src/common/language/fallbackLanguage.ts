import LanguageAPISpecs from "api-specifications/language";
import { getFallbackLanguage } from "server/config/config";

/**
 * Resolves the language the platform falls back to.
 *
 * The fall back language is configurable per environment, see FALL_BACK_LANGUAGE in server/config/config.ts. The
 * configuration is only a selection of a language of the registry, a value that the registry does not know about is
 * not a fall back language, in that case the fall back language of the registry is used.
 *
 * @returns the configuration of the fall back language, always an entry of the registry
 */
export function getFallbackLanguageConfig(): LanguageAPISpecs.Types.ILanguageConfig {
  const configuredShortCode = getFallbackLanguage().trim().toLowerCase();
  return (
    LanguageAPISpecs.Helpers.getLanguageByShortCode(configuredShortCode) ??
    LanguageAPISpecs.Constants.FALL_BACK_LANGUAGE
  );
}
