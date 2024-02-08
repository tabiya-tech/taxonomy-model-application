describe("Test the modelInfo module", () => {
  test("The modelInfo module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const modelInfoModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(modelInfoModule.default.Schemas.GET.Response.Payload).toBeDefined();
    expect(modelInfoModule.default.Schemas.POST.Response.Payload).toBeDefined();
    expect(modelInfoModule.default.Schemas.POST.Request.Payload).toBeDefined();
    // AND check if constants are defined in it
    const Constants = modelInfoModule.default.Constants;
    expect(Constants.NAME_MAX_LENGTH).toBeDefined();
    expect(Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
    expect(Constants.RELEASE_NOTES_MAX_LENGTH).toBeDefined();
    expect(Constants.VERSION_MAX_LENGTH).toBeDefined();
    expect(Constants.MAX_URI_LENGTH).toBeDefined();
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
