describe("Test the occupationGroup module", () => {
  test("The occupationGroup module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const occupationGroupModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(occupationGroupModule.default.Schemas.GET.Response.Payload).toBeDefined();
    expect(occupationGroupModule.default.Schemas.POST.Response.Payload).toBeDefined();
    expect(occupationGroupModule.default.Schemas.POST.Request.Payload).toBeDefined();
    // AND check if constants are defined in it
    const Constants = occupationGroupModule.default.Constants;
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
    expect(Constants.CODE_MAX_LENGTH).toBeDefined();
    expect(Constants.PREFERRED_LABEL_MAX_LENGTH).toBeDefined();
    expect(Constants.ALT_LABELS_MAX_ITEMS).toBeDefined();
    expect(Constants.ALT_LABEL_MAX_LENGTH).toBeDefined();
    expect(Constants.MAX_URI_LENGTH).toBeDefined();
    expect(Constants.IMPORT_ID_MAX_LENGTH).toBeDefined();
    expect(Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const occupationGroupModule = await import("./");
      expect(occupationGroupModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
