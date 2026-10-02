import { getExplorerTranslations, useExplorerTranslations } from "src/explorer/explorerTranslations";
import { DEFAULT_LANGUAGE } from "src/language/languages.service";
import { renderHook } from "src/_test_utilities/test-utils";

describe("explorerTranslations", () => {
  describe("getExplorerTranslations", () => {
    test.each(["en", "fr", "es", "pt"])("should return a complete translation for '%s'", (givenLanguage) => {
      // GIVEN a language that has a translation
      // WHEN the translations are resolved
      const actualTranslations = getExplorerTranslations(givenLanguage);

      // THEN expect every text to be translated (not empty)
      const expectedKeys = Object.keys(getExplorerTranslations(DEFAULT_LANGUAGE));
      expect(Object.keys(actualTranslations)).toEqual(expectedKeys);
      Object.values(actualTranslations).forEach((text) => expect(text.trim()).not.toBe(""));
    });

    test("should return the texts of the selected language", () => {
      // GIVEN french is the display language
      // WHEN the translations are resolved
      const actualTranslations = getExplorerTranslations("fr");

      // THEN expect the french texts
      expect(actualTranslations.TAB_SKILLS).toBe("Compétences");
    });

    test.each(["am", "xx", ""])(
      "should fall back to the default language when there is no translation for '%s'",
      (givenLanguage) => {
        // GIVEN a language without a translation
        // WHEN the translations are resolved
        const actualTranslations = getExplorerTranslations(givenLanguage);

        // THEN expect the default language's texts
        expect(actualTranslations).toEqual(getExplorerTranslations(DEFAULT_LANGUAGE));
      }
    );
  });

  describe("useExplorerTranslations", () => {
    test("should return the texts of the default language when nothing has been selected", () => {
      // GIVEN no language has been selected
      // WHEN the hook is used
      const { result } = renderHook(() => useExplorerTranslations());

      // THEN expect the default language's texts
      expect(result.current).toEqual(getExplorerTranslations(DEFAULT_LANGUAGE));
    });
  });
});
