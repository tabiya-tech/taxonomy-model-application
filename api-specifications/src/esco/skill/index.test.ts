describe("Test the Skill module", () => {
  test("The Skill module can be required via the index", async () => {
    // GIVEN the module
    expect(async () => await import("./")).not.toThrow();

    const skillModule = await import("./");

    // THEN check if Schemas are defined
    expect(skillModule.default.Schemas.GET.Response.Payload).toBeDefined();
    expect(skillModule.default.Schemas.POST.Response.Payload).toBeDefined();
    expect(skillModule.default.Schemas.POST.Request.Payload).toBeDefined();

    // AND check if constants are defined
    const Constants = skillModule.default.Constants;
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
    expect(Constants.DEFINITION_MAX_LENGTH).toBeDefined();
    expect(Constants.PREFERRED_LABEL_MAX_LENGTH).toBeDefined();
    expect(Constants.ALT_LABELS_MAX_ITEMS).toBeDefined();
    expect(Constants.ALT_LABEL_MAX_LENGTH).toBeDefined();
    expect(Constants.ORIGIN_URI_MAX_LENGTH).toBeDefined();
    expect(Constants.PATH_URI_MAX_LENGTH).toBeDefined();
    expect(Constants.TABIYA_PATH_URI_MAX_LENGTH).toBeDefined();
    expect(Constants.UUID_HISTORY_MAX_ITEMS).toBeDefined();
    expect(Constants.UUID_HISTORY_MAX_LENGTH).toBeDefined();
    expect(Constants.SCOPE_NOTE_MAX_LENGTH).toBeDefined();
    expect(Constants.SIGNALLING_VALUE_MIN).toBeDefined();
    expect(Constants.SIGNALLING_VALUE_MAX).toBeDefined();
    expect(Constants.SIGNALLING_VALUE_LABEL_MAX_LENGTH).toBeDefined();
    expect(Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
    expect(Constants.MAX_LIMIT).toBeDefined();
    expect(Constants.MAX_CURSOR_LENGTH).toBeDefined();
  });

  test("The export module matches the snapshot", async () => {
    const skillModule = await import("./");
    expect(skillModule.default).toMatchSnapshot();
  });
});
