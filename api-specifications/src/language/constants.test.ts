import LanguageConstants from "./constants";
import LanguageTypes from "./types";

describe("Test the Language Constants", () => {
  describe("Test the Languages registry", () => {
    test("the registry should contain at least english and french", () => {
      // GIVEN the registry of languages
      const givenLanguages = LanguageConstants.Languages;
      // AND the short codes that the platform supports at a minimum
      const givenMinimumShortCodes = ["en", "fr"];

      // WHEN the short codes are extracted from the registry
      const actualShortCodes = givenLanguages.map((language) => language.shortCode);

      // THEN expect the registry to contain every minimum short code
      expect(actualShortCodes).toEqual(expect.arrayContaining(givenMinimumShortCodes));
    });

    test("the registry should be a frozen array", () => {
      // GIVEN the registry of languages
      const givenLanguages = LanguageConstants.Languages;

      // WHEN the registry is inspected
      const actualIsFrozen = Object.isFrozen(givenLanguages);

      // THEN expect the registry to be frozen
      expect(actualIsFrozen).toBe(true);
    });

    test("the registry should not be mutable at runtime", () => {
      // GIVEN the registry of languages seen by a consumer that ignores the readonly type
      const givenMutableLanguages = LanguageConstants.Languages as unknown as LanguageTypes.ILanguageConfig[];
      // AND a language that is not in the registry
      const givenUnsupportedLanguage: LanguageTypes.ILanguageConfig = {
        name: "Klingon",
        shortCode: "tlh",
        dbKeyName: "tlh",
        csvSuffix: "TLH",
      };
      // AND the number of languages before the mutation is attempted
      const givenNumberOfLanguages = givenMutableLanguages.length;

      // WHEN the consumer tries to add the language to the registry
      const actualMutation = () => givenMutableLanguages.push(givenUnsupportedLanguage);

      // THEN expect the mutation to throw
      expect(actualMutation).toThrow();
      // AND expect the registry to be unchanged
      expect(LanguageConstants.Languages).toHaveLength(givenNumberOfLanguages);
    });

    test.each(LanguageConstants.Languages.map((language) => [language.name, language] as const))(
      "the language '%s' should be frozen",
      (_name, givenLanguage) => {
        // GIVEN a language of the registry

        // WHEN the language is inspected
        const actualIsFrozen = Object.isFrozen(givenLanguage);

        // THEN expect the language to be frozen
        expect(actualIsFrozen).toBe(true);
      }
    );

    test.each([["shortCode"], ["dbKeyName"], ["csvSuffix"]] as const)(
      "every language should have a unique '%s' in the entire registry",
      (givenPropertyName) => {
        // GIVEN the registry of languages
        const givenLanguages = LanguageConstants.Languages;

        // WHEN the values of the property are extracted from the registry
        const actualUniqueValues = new Set(givenLanguages.map((language) => language[givenPropertyName]));

        // THEN expect as many unique values as there are registered languages
        expect(actualUniqueValues.size).toBe(givenLanguages.length);
      }
    );

    test.each(LanguageConstants.Languages.map((language) => [language.name, language] as const))(
      "the language '%s' should match the snapshot",
      (_name, givenLanguage) => {
        // GIVEN a language of the registry

        // WHEN the language is inspected
        // THEN expect the language to match the snapshot
        expect(givenLanguage).toMatchSnapshot();
      }
    );
  });

  describe("Test the FALLBACK_LANGUAGE", () => {
    test("the fall back language should be english", () => {
      // GIVEN the fall back language
      const givenFallBackLanguage = LanguageConstants.FALLBACK_LANGUAGE;
      // AND the short code the platform falls back to
      const expectedShortCode = "en";

      // WHEN the short code of the fall back language is read
      const actualShortCode = givenFallBackLanguage.shortCode;

      // THEN expect the short code to be the expected one
      expect(actualShortCode).toBe(expectedShortCode);
    });

    test("the fall back language should be an entry of the registry", () => {
      // GIVEN the fall back language
      const givenFallBackLanguage = LanguageConstants.FALLBACK_LANGUAGE;

      // WHEN the registry is searched for the fall back language
      const actualLanguages = LanguageConstants.Languages;

      // THEN expect the registry to contain the very same object, not a copy of it
      expect(actualLanguages).toContain(givenFallBackLanguage);
    });
  });
});
