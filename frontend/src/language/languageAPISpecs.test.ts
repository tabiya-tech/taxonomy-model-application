import LanguageAPISpecs from "api-specifications/language";

/**
 * The language registry is a bundled constant of api-specifications, the frontend consumes it with a plain import from
 * the linked package. These tests guard that consumption: that the "api-specifications/language" subpath resolves,
 * that the registry the frontend sees is the bundled one, and that it is not mutable from here.
 */
describe("Test the language registry as it is consumed by the frontend", () => {
  test("the language registry should be imported directly from the linked api-specifications package", () => {
    // GIVEN the language module of api-specifications
    const givenLanguageAPISpecs = LanguageAPISpecs;

    // WHEN the module is inspected
    // THEN expect the registry, the fall back language, the schema and the helpers to be available
    expect(givenLanguageAPISpecs.Constants.Languages).toBeDefined();
    expect(givenLanguageAPISpecs.Constants.FALLBACK_LANGUAGE).toBeDefined();
    expect(givenLanguageAPISpecs.Schemas.Payload).toBeDefined();
    expect(givenLanguageAPISpecs.Helpers.getLanguageByShortCode).toBeDefined();
    expect(givenLanguageAPISpecs.Helpers.getLanguageByCsvSuffix).toBeDefined();
    expect(givenLanguageAPISpecs.Helpers.isSupportedLanguage).toBeDefined();
  });

  test("the language registry should contain at least english and french", () => {
    // GIVEN the language registry
    const givenLanguages = LanguageAPISpecs.Constants.Languages;
    // AND the short codes the frontend expects to be supported at a minimum
    const givenMinimumShortCodes = ["en", "fr"];

    // WHEN the short codes are extracted from the registry
    const actualShortCodes = givenLanguages.map((language) => language.shortCode);

    // THEN expect the registry to contain every minimum short code
    expect(actualShortCodes).toEqual(expect.arrayContaining(givenMinimumShortCodes));
  });

  test("the fall back language should be an entry of the registry", () => {
    // GIVEN the fall back language
    const givenFallBackLanguage = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE;

    // WHEN the registry is searched for the fall back language
    const actualLanguages = LanguageAPISpecs.Constants.Languages;

    // THEN expect the registry to contain the very same object, not a copy of it
    expect(actualLanguages).toContain(givenFallBackLanguage);
  });

  test("the language registry should not be mutable by the frontend", () => {
    // GIVEN the language registry seen by a consumer that ignores the readonly type
    const givenMutableLanguages = LanguageAPISpecs.Constants
      .Languages as unknown as LanguageAPISpecs.Types.ILanguageConfig[];
    // AND a language that is not in the registry
    const givenUnsupportedLanguage: LanguageAPISpecs.Types.ILanguageConfig = {
      name: "Klingon",
      shortCode: "tlh",
      dbKeyName: "tlh",
      csvSuffix: "TLH",
    };
    // AND the number of languages before the mutation is attempted
    const givenNumberOfLanguages = givenMutableLanguages.length;

    // WHEN the frontend tries to add the language to the registry
    const actualMutation = () => givenMutableLanguages.push(givenUnsupportedLanguage);

    // THEN expect the mutation to throw
    expect(actualMutation).toThrow();
    // AND expect the registry to be unchanged
    expect(LanguageAPISpecs.Constants.Languages).toHaveLength(givenNumberOfLanguages);
  });

  test("the language lookups should resolve a language of the registry by its short code and by its CSV suffix", () => {
    // GIVEN a language of the registry
    const givenLanguage = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE;

    // WHEN the language is looked up by its short code and by its CSV suffix
    const actualLanguageByShortCode = LanguageAPISpecs.Helpers.getLanguageByShortCode(givenLanguage.shortCode);
    const actualLanguageByCsvSuffix = LanguageAPISpecs.Helpers.getLanguageByCsvSuffix(givenLanguage.csvSuffix);

    // THEN expect both lookups to resolve to the very entry of the registry
    expect(actualLanguageByShortCode).toBe(givenLanguage);
    expect(actualLanguageByCsvSuffix).toBe(givenLanguage);
    // AND expect its short code to be a supported language
    expect(LanguageAPISpecs.Helpers.isSupportedLanguage(givenLanguage.shortCode)).toBe(true);
  });
});
