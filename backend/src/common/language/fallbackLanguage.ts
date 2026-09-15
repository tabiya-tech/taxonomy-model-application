import LanguageAPISpecs from "api-specifications/language";
import { getFallbackLanguage } from "server/config/config";

/**
 * Resolves the language the platform falls back to.
 *
 * @returns the configuration of the fall back language, always an entry of the registry
 */
export function getFallbackLanguageConfig(): LanguageAPISpecs.Types.ILanguageConfig {
  const configuredShortCode = getFallbackLanguage().trim().toLowerCase();
  return (
    LanguageAPISpecs.Helpers.getLanguageByShortCode(configuredShortCode) ?? LanguageAPISpecs.Constants.FALLBACK_LANGUAGE
  );
}
