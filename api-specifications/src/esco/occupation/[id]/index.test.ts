describe("Test the Occupation Instance module", () => {
  test("The Occupation Instance module can be required via the index", async () => {
    // GIVEN the module
    expect(async () => await import("./")).not.toThrow();

    const occupationInstanceModule = await import("./");

    // THEN check if Schemas are defined
    expect(occupationInstanceModule.default.GET.Schemas.Request.Param.Payload).toBeDefined();
    expect(occupationInstanceModule.default.Parent.GET.Schemas.Response.Payload).toBeDefined();
    expect(occupationInstanceModule.default.Children.GET.Schemas.Response.Payload).toBeDefined();
    expect(occupationInstanceModule.default.Skills.GET.Schemas.Response.Payload).toBeDefined();

    // AND check if constants are defined
    const Constants = occupationInstanceModule.default.Constants;
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
    expect(Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH).toBeDefined();
    expect(Constants.CODE_MAX_LENGTH).toBeDefined();
    expect(Constants.OCCUPATION_GROUP_CODE_MAX_LENGTH).toBeDefined();
    // MAX_POST_PAYLOAD_LENGTH is POST-specific, accessible via OccupationAPISpecs.POSTOccupation.Constants
    expect(Constants.MAX_LIMIT).toBeDefined();
    expect(Constants.MAX_CURSOR_LENGTH).toBeDefined();

    // AND check if Enums are defined
    const Enums = occupationInstanceModule.default.Enums;
    expect(Enums).toBeDefined();
    expect(Enums.OccupationType).toBeDefined();
    expect(Enums.OccupationType.ESCOOccupation).toBeDefined();
    expect(Enums.OccupationType.LocalOccupation).toBeDefined();
  });

  test("The export module matches the snapshot", async () => {
    const occupationInstanceModule = await import("./");
    expect(occupationInstanceModule.default).toMatchSnapshot();
  });
});
