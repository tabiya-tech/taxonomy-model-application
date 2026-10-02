// mute the console output
import "src/_test_utilities/consoleMock";

import LanguageAPISpecs from "api-specifications/language";
import { DEFAULT_LANGUAGE, getLanguageName, getLanguageOptions } from "./languages.service";

describe("languages.service", () => {
  describe("DEFAULT_LANGUAGE", () => {
    test("should be the short code of the registry's fallback language", () => {
      // GIVEN the registry's fallback language
      const givenFallbackLanguage = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE;

      // WHEN DEFAULT_LANGUAGE is inspected
      const actualDefaultLanguage = DEFAULT_LANGUAGE;

      // THEN expect it to be the fallback language's short code
      expect(actualDefaultLanguage).toEqual(givenFallbackLanguage.shortCode);
    });
  });

  describe("getLanguageName", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test.each([
      ["en", "English"],
      ["fr", "Français"],
      ["es", "Español"],
      ["pt", "Português"],
    ])("should resolve '%s' to the language's own name '%s'", (givenShortCode, expectedName) => {
      // GIVEN a short code of a language in the registry
      // WHEN getLanguageName is called with it
      const actualName = getLanguageName(givenShortCode);

      // THEN expect the language's name written in that language, capitalized
      expect(actualName).toEqual(expectedName);
    });

    test("should fall back to the registry name when the browser cannot name the language", () => {
      // GIVEN a short code of a language in the registry
      const givenShortCode = "fr";
      // AND the browser does not support naming languages
      jest.spyOn(Intl, "DisplayNames").mockImplementation(() => {
        throw new Error("Intl.DisplayNames is not supported");
      });

      // WHEN getLanguageName is called with it
      const actualName = getLanguageName(givenShortCode);

      // THEN expect the registry's name for that language
      expect(actualName).toEqual(LanguageAPISpecs.Helpers.getLanguageByShortCode(givenShortCode)?.name);
    });

    test("should fall back to the registry name when the browser has no name for the language", () => {
      // GIVEN a short code of a language in the registry
      const givenShortCode = "am";
      // AND the browser has no name for it, so it returns the short code unchanged
      jest
        .spyOn(Intl, "DisplayNames")
        .mockImplementation(() => ({ of: (code: string) => code }) as unknown as Intl.DisplayNames);

      // WHEN getLanguageName is called with it
      const actualName = getLanguageName(givenShortCode);

      // THEN expect the registry's name for that language
      expect(actualName).toEqual(LanguageAPISpecs.Helpers.getLanguageByShortCode(givenShortCode)?.name);
    });

    test("should fall back to the short code itself when it is not in the registry", () => {
      // GIVEN a short code that is not in the registry
      const givenUnknownShortCode = "xx";

      // WHEN getLanguageName is called with it
      const actualName = getLanguageName(givenUnknownShortCode);

      // THEN expect the short code to be returned unchanged
      expect(actualName).toEqual(givenUnknownShortCode);
    });
  });

  describe("getLanguageOptions", () => {
    test("should resolve a list of short codes into display options, in the given order", () => {
      // GIVEN a model's available languages
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN getLanguageOptions is called with them
      const actualOptions = getLanguageOptions(givenAvailableLanguages);

      // THEN expect each short code to be paired with its own name, in the same order
      expect(actualOptions).toEqual([
        { shortCode: "en", name: "English" },
        { shortCode: "fr", name: "Français" },
      ]);
    });

    test("should return an empty array when given no available languages", () => {
      // GIVEN no available languages
      const givenAvailableLanguages: string[] = [];

      // WHEN getLanguageOptions is called with them
      const actualOptions = getLanguageOptions(givenAvailableLanguages);

      // THEN expect an empty array
      expect(actualOptions).toEqual([]);
    });
  });
});
