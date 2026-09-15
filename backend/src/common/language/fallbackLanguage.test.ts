import LanguageAPISpecs from "api-specifications/language";
import { setConfiguration } from "server/config/config";
import { getFallbackLanguageConfig } from "./fallbackLanguage";

describe("Test getFallbackLanguageConfig()", () => {
  afterEach(() => {
    // restore the configuration so that a test does not leak its fall back language into the next one
    // @ts-ignore
    setConfiguration(undefined);
  });

  test("should return the configured language when the configured language is in the registry", () => {
    // GIVEN a language of the registry that is not the fall back language of the registry
    const givenLanguage = LanguageAPISpecs.Constants.Languages.find(
      (language) => language !== LanguageAPISpecs.Constants.FALLBACK_LANGUAGE
    )!;
    // AND the environment is configured to fall back to that language
    // @ts-ignore
    setConfiguration({ fallbackLanguage: givenLanguage.shortCode });

    // WHEN the fall back language is resolved
    const actualFallbackLanguage = getFallbackLanguageConfig();

    // THEN expect the configured language to be returned
    expect(actualFallbackLanguage).toBe(givenLanguage);
  });

  test("should ignore the case and the surrounding whitespace of the configured language", () => {
    // GIVEN a language of the registry
    const givenLanguage = LanguageAPISpecs.Constants.Languages[0];
    // AND the environment is configured to fall back to that language, in a sloppy spelling
    // @ts-ignore
    setConfiguration({ fallbackLanguage: `  ${givenLanguage.shortCode.toUpperCase()} ` });

    // WHEN the fall back language is resolved
    const actualFallbackLanguage = getFallbackLanguageConfig();

    // THEN expect the configured language to be returned
    expect(actualFallbackLanguage).toBe(givenLanguage);
  });

  test.each([
    ["is not in the registry", "tlh"],
    ["is empty", ""],
    ["is blank", "   "],
  ])(
    "should return the fall back language of the registry when the configured language %s",
    (_description, givenConfiguredLanguage) => {
      // GIVEN the environment is configured to fall back to the given language
      // @ts-ignore
      setConfiguration({ fallbackLanguage: givenConfiguredLanguage });

      // WHEN the fall back language is resolved
      const actualFallbackLanguage = getFallbackLanguageConfig();

      // THEN expect the fall back language of the registry to be returned
      expect(actualFallbackLanguage).toBe(LanguageAPISpecs.Constants.FALLBACK_LANGUAGE);
    }
  );

  test("should return the fall back language of the registry when the environment is not configured", () => {
    // GIVEN the environment is not configured
    // @ts-ignore
    setConfiguration(undefined);

    // WHEN the fall back language is resolved
    const actualFallbackLanguage = getFallbackLanguageConfig();

    // THEN expect the fall back language of the registry to be returned
    expect(actualFallbackLanguage).toBe(LanguageAPISpecs.Constants.FALLBACK_LANGUAGE);
  });
});
