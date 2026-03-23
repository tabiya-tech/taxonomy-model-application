describe("Test the occupationGroup GET module", () => {
  test("The occupationGroup GET module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const occupationGroupGETModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(occupationGroupGETModule.default.Schemas.Response.Payload).toBeDefined();
    expect(occupationGroupGETModule.default.Schemas.Request.Param.Payload).toBeDefined();
    expect(occupationGroupGETModule.default.Schemas.Request.Query.Payload).toBeDefined();

    // AND check if constants are defined in it
    const Constants = occupationGroupGETModule.default.Constants;
    expect(Constants.DEFAULT_LIMIT).toBeDefined();
    expect(Constants.MAX_LIMIT).toBeDefined();
    expect(Constants.MAX_CURSOR_LENGTH).toBeDefined();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const occupationGroupGETModule = await import("./");
      expect(occupationGroupGETModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});
