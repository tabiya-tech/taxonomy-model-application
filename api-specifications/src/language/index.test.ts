describe("Test the language module", () => {
  test("The language module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const languageModule = await import("./");

    // THEN check if Schema is defined in it
    expect(languageModule.default.Schemas.Payload).toBeDefined();
    // AND check if constants are defined in it
    expect(languageModule.default.Constants.NAME_MAX_LENGTH).toBeDefined();
    expect(languageModule.default.Constants.SHORT_CODE_MAX_LENGTH).toBeDefined();
    expect(languageModule.default.Constants.DB_KEY_NAME_MAX_LENGTH).toBeDefined();
    expect(languageModule.default.Constants.CSV_SUFFIX_MAX_LENGTH).toBeDefined();
    // AND check if the registry is defined in it
    expect(languageModule.default.Constants.Languages).toBeDefined();
    expect(languageModule.default.Constants.FALL_BACK_LANGUAGE).toBeDefined();
    // AND check if the helpers are defined in it
    expect(languageModule.default.Helpers.getLanguageByShortCode).toBeDefined();
    expect(languageModule.default.Helpers.getLanguageByCsvSuffix).toBeDefined();
    expect(languageModule.default.Helpers.isSupportedLanguage).toBeDefined();
  });

  test("The language module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const languageModule = await import("./");
      expect(languageModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
