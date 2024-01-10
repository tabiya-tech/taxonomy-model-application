describe("Test the modelInfo module", () => {
  test("The modelInfo module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      const modelInfoModule = await import("./");
      // AND the schemas should be defined
      expect(modelInfoModule.default.Schemas.GET.Response.Payload).toBeDefined();
      expect(modelInfoModule.default.Schemas.POST.Response.Payload).toBeDefined();
      expect(modelInfoModule.default.Schemas.POST.Request.Payload).toBeDefined();

      // AND the constants should be defined
      const Constants = modelInfoModule.default.Constants;
      expect(Constants.NAME_MAX_LENGTH).toBeDefined();
      expect(Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
      expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
      expect(Constants.RELEASE_NOTES_MAX_LENGTH).toBeDefined();
      expect(Constants.VERSION_MAX_LENGTH).toBeDefined();
    }).not.toThrowError();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const modelInfoModule = await import("./");
      expect(modelInfoModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
