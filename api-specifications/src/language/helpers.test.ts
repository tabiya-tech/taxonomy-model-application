import LanguageConstants from "./constants";
import LanguageHelpers from "./helpers";

describe("Test the Language Helpers", () => {
  describe("Test getLanguageByShortCode", () => {
    test.each(LanguageConstants.Languages.map((language) => [language.shortCode, language] as const))(
      "should return the language of the registry for the short code '%s'",
      (givenShortCode, expectedLanguage) => {
        // GIVEN the short code of a language of the registry

        // WHEN the language is looked up by its short code
        const actualLanguage = LanguageHelpers.getLanguageByShortCode(givenShortCode);

        // THEN expect the very entry of the registry to be returned, not a copy of it
        expect(actualLanguage).toBe(expectedLanguage);
      }
    );

    test.each([
      ["a short code that is not in the registry", "tlh"],
      ["a short code with a different case", "EN"],
      ["a CSV suffix instead of a short code", "FR"],
      ["an empty short code", ""],
    ])("should return undefined for %s", (_description, givenShortCode) => {
      // GIVEN a short code that no language of the registry has

      // WHEN the language is looked up by its short code
      const actualLanguage = LanguageHelpers.getLanguageByShortCode(givenShortCode);

      // THEN expect no language to be returned
      expect(actualLanguage).toBeUndefined();
    });
  });

  describe("Test getLanguageByCsvSuffix", () => {
    test.each(LanguageConstants.Languages.map((language) => [language.csvSuffix, language] as const))(
      "should return the language of the registry for the CSV suffix '%s'",
      (givenCsvSuffix, expectedLanguage) => {
        // GIVEN the CSV suffix of a language of the registry

        // WHEN the language is looked up by its CSV suffix
        const actualLanguage = LanguageHelpers.getLanguageByCsvSuffix(givenCsvSuffix);

        // THEN expect the very entry of the registry to be returned, not a copy of it
        expect(actualLanguage).toBe(expectedLanguage);
      }
    );

    test.each([
      ["a CSV suffix that is not in the registry", "TLH"],
      ["a CSV suffix with a different case", "fr"],
      ["a short code instead of a CSV suffix", "en"],
      ["an empty CSV suffix", ""],
    ])("should return undefined for %s", (_description, givenCsvSuffix) => {
      // GIVEN a CSV suffix that no language of the registry has

      // WHEN the language is looked up by its CSV suffix
      const actualLanguage = LanguageHelpers.getLanguageByCsvSuffix(givenCsvSuffix);

      // THEN expect no language to be returned
      expect(actualLanguage).toBeUndefined();
    });
  });

  describe("Test isSupportedLanguage", () => {
    test.each(LanguageConstants.Languages.map((language) => [language.shortCode] as const))(
      "should return true for the short code '%s' of the registry",
      (givenShortCode) => {
        // GIVEN the short code of a language of the registry

        // WHEN the short code is checked
        const actualIsSupported = LanguageHelpers.isSupportedLanguage(givenShortCode);

        // THEN expect the short code to be supported
        expect(actualIsSupported).toBe(true);
      }
    );

    test.each([
      ["a short code that is not in the registry", "tlh"],
      ["a short code with a different case", "EN"],
      ["a CSV suffix instead of a short code", "FR"],
      ["an empty short code", ""],
    ])("should return false for %s", (_description, givenShortCode) => {
      // GIVEN a short code that no language of the registry has

      // WHEN the short code is checked
      const actualIsSupported = LanguageHelpers.isSupportedLanguage(givenShortCode);

      // THEN expect the short code to not be supported
      expect(actualIsSupported).toBe(false);
    });

    test("should return true for the short code of the fall back language", () => {
      // GIVEN the short code of the fall back language
      const givenShortCode = LanguageConstants.FALLBACK_LANGUAGE.shortCode;

      // WHEN the short code is checked
      const actualIsSupported = LanguageHelpers.isSupportedLanguage(givenShortCode);

      // THEN expect the short code to be supported
      expect(actualIsSupported).toBe(true);
    });
  });
});
