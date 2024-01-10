describe("Test the locale module", () => {
  test("The locale module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const localeModule = await import("./");

    // THEN check if Schema is defined in it
    expect(localeModule.default.Schemas.Payload).toBeDefined();
    // AND check if constants are defined in it
    expect(localeModule.default.Constants.LOCALE_SHORTCODE_MAX_LENGTH).toBeDefined();
    expect(localeModule.default.Constants.NAME_MAX_LENGTH).toBeDefined();
  });

  test("The locale module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const localeModule = await import("./");
      expect(localeModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
