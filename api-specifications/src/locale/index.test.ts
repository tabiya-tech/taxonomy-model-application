describe("Test the locale module", () => {
  test("The locale module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      // AND check if Schema is defined in it
      const localeModule = await import("./");
      expect(localeModule.default.Schemas.Payload).toBeDefined();

      // AND check if Constants is defined in it
      expect(localeModule.default.Constants.LOCALE_SHORTCODE_MAX_LENGTH).toBeDefined();
      expect(localeModule.default.Constants.NAME_MAX_LENGTH).toBeDefined();
    }).not.toThrowError();
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
