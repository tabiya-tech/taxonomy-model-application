describe("Test the modelInfo module", () => {
  test("The modelInfo module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require('./');
      }).not.toThrowError();

      let modelInfoModule = require('./').default;
      // AND the schemas should be defined
      expect(modelInfoModule.Schemas.GET.Response.Payload).toBeDefined();
      expect(modelInfoModule.Schemas.POST.Response.Payload).toBeDefined();
      expect(modelInfoModule.Schemas.POST.Request.Payload).toBeDefined();

      // AND the constants should be defined
      const Constants = modelInfoModule.Constants;
      expect(Constants.NAME_MAX_LENGTH).toBeDefined();
      expect(Constants.LOCALE_SHORTCODE_MAX_LENGTH).toBeDefined();
      expect(Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
      expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
      expect(Constants.RELEASE_NOTES_MAX_LENGTH).toBeDefined();
      expect(Constants.VERSION_MAX_LENGTH).toBeDefined();
    }).not.toThrowError();
  })
});

export {}
