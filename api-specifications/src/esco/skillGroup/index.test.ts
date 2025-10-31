describe("Test the skillGroup module", () => {
  test("The skillGroup module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow();
    const skillGroupModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(skillGroupModule.default.Schemas.GET.Response.Payload).toBeDefined();
    expect(skillGroupModule.default.Schemas.POST.Response.Payload).toBeDefined();
    expect(skillGroupModule.default.Schemas.POST.Request.Payload).toBeDefined();
    expect(skillGroupModule.default.Schemas.GET.Request.Param.Payload).toBeDefined();
    expect(skillGroupModule.default.Schemas.GET.Request.ById.Param.Payload).toBeDefined();
    expect(skillGroupModule.default.Schemas.GET.Request.Query.Payload).toBeDefined();

    // AND check if constants are defined in it
    const Constants = skillGroupModule.default.Constants;
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
    expect(Constants.CODE_MAX_LENGTH).toBeDefined();
    expect(Constants.PREFERRED_LABEL_MAX_LENGTH).toBeDefined();
    expect(Constants.ALT_LABELS_MAX_ITEMS).toBeDefined();
    expect(Constants.ALT_LABEL_MAX_LENGTH).toBeDefined();
    expect(Constants.ORIGIN_URI_MAX_LENGTH).toBeDefined();
    expect(Constants.UUID_HISTORY_MAX_ITEMS).toBeDefined();
    expect(Constants.MAX_LIMIT).toBeDefined();
    expect(Constants.DEFAULT_LIMIT).toBeDefined();
    expect(Constants.MAX_UUID_HISTORY_ITEM_LENGTH).toBeDefined();
    expect(Constants.MAX_PATH_URI_LENGTH).toBeDefined();
    expect(Constants.MAX_TABIYA_PATH_LENGTH).toBeDefined();
    expect(Constants.MAX_JSON_OVERHEAD).toBeDefined();
    expect(Constants.MAX_SCOPE_NOTE_LENGTH).toBeDefined();
    expect(Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN check if the module can be required without error
      const skillGroupModule = await import("./");
      expect(skillGroupModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});
