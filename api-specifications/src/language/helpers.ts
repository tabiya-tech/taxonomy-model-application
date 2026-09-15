import LanguageConstants from "./constants";
import LanguageTypes from "./types";

/**
 * The lookup helpers of the language registry.
 *
 * The lookups are exact and case sensitive. The registry is the contract, a caller that holds a value coming from the
 * outside world (an Accept-Language header, a CSV column name) is responsible for normalizing it first.
 */
namespace LanguageHelpers {
  /**
   * Finds the language of the registry with the given short code.
   * @param shortCode the short code to look up, e.g. "fr"
   * @returns the language configuration, or undefined when the registry has no language with that short code
   */
  export function getLanguageByShortCode(shortCode: string): LanguageTypes.ILanguageConfig | undefined {
    return LanguageConstants.Languages.find((language) => language.shortCode === shortCode);
  }

  /**
   * Finds the language of the registry with the given CSV column suffix.
   * @param csvSuffix the CSV column suffix to look up, e.g. "FR"
   * @returns the language configuration, or undefined when the registry has no language with that CSV suffix
   */
  export function getLanguageByCsvSuffix(csvSuffix: string): LanguageTypes.ILanguageConfig | undefined {
    return LanguageConstants.Languages.find((language) => language.csvSuffix === csvSuffix);
  }

  /**
   * Tells whether the given short code is the short code of a language of the registry.
   * @param shortCode the short code to check, e.g. "fr"
   * @returns true when the registry has a language with that short code, narrowing the short code to a supported one
   */
  export function isSupportedLanguage(shortCode: string): shortCode is LanguageTypes.LanguageShortCode {
    return LanguageConstants.Languages.some((language) => language.shortCode === shortCode);
  }
}

export default LanguageHelpers;
