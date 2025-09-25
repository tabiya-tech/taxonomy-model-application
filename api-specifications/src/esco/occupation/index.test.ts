describe("Test the Occupation module", () => {
  test("The Occupation module can be required via the index", async () => {
    // GIVEN the module
    expect(async () => await import("./")).not.toThrow();

    const occupationModule = await import("./");

    // THEN check if Schemas are defined
    expect(occupationModule.default.Schemas.GET.Response.Payload).toBeDefined();
    expect(occupationModule.default.Schemas.POST.Response.Payload).toBeDefined();
    expect(occupationModule.default.Schemas.POST.Request.Payload).toBeDefined();

    // AND check if constants are defined
    const Constants = occupationModule.default.Constants;
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
    expect(Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
    expect(Constants.MAX_LIMIT).toBeDefined();
    expect(Constants.MAX_CURSOR_LENGTH).toBeDefined();

    // AND check if Enums are defined
    const Enums = occupationModule.default.Enums;
    expect(Enums).toBeDefined();
    expect(Enums).toBeDefined();
    expect(Enums.OccupationType).toBeDefined();
    expect(Enums.OccupationType.ESCOOccupation).toBeDefined();
    expect(Enums.OccupationType.LocalOccupation).toBeDefined();

    // AND check if GET Response Error Codes are defined
    expect(Enums.GET.Response.ErrorCodes).toBeDefined();
    expect(Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS).toBeDefined();
    expect(Enums.GET.Response.ErrorCodes.INVALID_OCCUPATION_ID).toBeDefined();
    expect(Enums.GET.Response.ErrorCodes.INVALID_LIMIT).toBeDefined();
    expect(Enums.GET.Response.ErrorCodes.INVALID_NEXT_CURSOR).toBeDefined();

    // AND check if POST Response Error Codes are defined
    expect(Enums.POST.Response.ErrorCodes).toBeDefined();
    expect(Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION).toBeDefined();
    expect(Enums.POST.Response.ErrorCodes.OCCUPATION_COULD_NOT_VALIDATE).toBeDefined();
    expect(Enums.POST.Response.ErrorCodes.INVALID_MODEL_ID).toBeDefined();
  });

  test("The export module matches the snapshot", async () => {
    const occupationModule = await import("./");
    expect(occupationModule.default).toMatchSnapshot();
  });
});
