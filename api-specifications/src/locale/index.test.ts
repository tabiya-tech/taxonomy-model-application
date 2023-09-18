describe("Test the locale module", () => {
  test("The locale module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require('./');
      }).not.toThrowError();
      // AND check if Schema is defined in it
      const localeModule = require('./').default;
      expect(localeModule.Schemas.Payload).toBeDefined();

      // AND check if Constants is defined in it
      expect(localeModule.Constants.LOCALE_SHORTCODE_MAX_LENGTH).toBeDefined();
      expect(localeModule.Constants.NAME_MAX_LENGTH).toBeDefined();
    }).not.toThrowError();
  })
});

export {}