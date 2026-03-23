describe("Test the occupationGroup POST module", () => {
  test("The occupationGroup POST module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const occupationGroupPOSTModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(occupationGroupPOSTModule.default.Schemas.Response.Payload).toBeDefined();
    expect(occupationGroupPOSTModule.default.Schemas.Request.Payload).toBeDefined();

    // AND check if constants are defined in it
    const Constants = occupationGroupPOSTModule.default.Constants;
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
    expect(Constants.CODE_MAX_LENGTH).toBeDefined();
    expect(Constants.PREFERRED_LABEL_MAX_LENGTH).toBeDefined();
    expect(Constants.TOTAL_ALT_LABELS_MAX_LENGTH).toBeDefined();
    expect(Constants.ORIGIN_URI_MAX_LENGTH).toBeDefined();
    expect(Constants.TOTAL_UUID_HISTORY_MAX_LENGTH).toBeDefined();
    expect(Constants.MAX_PATH_URI_LENGTH).toBeDefined();
    expect(Constants.MAX_TABIYA_PATH_LENGTH).toBeDefined();
    expect(Constants.MAX_JSON_OVERHEAD).toBeDefined();
    expect(Constants.MAX_POST_PAYLOAD_LENGTH).toBeDefined();
  });
  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const occupationGroupPOSTModule = await import("./");
      expect(occupationGroupPOSTModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});
