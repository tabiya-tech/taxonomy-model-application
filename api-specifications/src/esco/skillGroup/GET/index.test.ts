describe("Test the skillGroup GET module", () => {
  test("The skillGroup GET module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const skillGroupGETModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(skillGroupGETModule.default.Schemas.Response.Payload).toBeDefined();
    expect(skillGroupGETModule.default.Schemas.Request.Param.Payload).toBeDefined();
    expect(skillGroupGETModule.default.Schemas.Request.Query.Payload).toBeDefined();

    // AND check if constants are defined in it
    const Constants = skillGroupGETModule.default.Constants;
    expect(Constants.DEFAULT_LIMIT).toBeDefined();
    expect(Constants.MAX_CURSOR_LENGTH).toBeDefined();
    expect(Constants.MAX_LIMIT).toBeDefined();
  });
  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const skillGroupGETModule = await import("./");
      expect(skillGroupGETModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});
