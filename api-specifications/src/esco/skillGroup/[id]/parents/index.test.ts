describe("Test the skillGroup GET parent module", () => {
  test("The skillGroup GET parent module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const skillGroupGETParentModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(skillGroupGETParentModule.default.GET.Schemas.Response.Payload).toBeDefined();
    expect(skillGroupGETParentModule.default.GET.Schemas.Response.Parents.Payload).toBeDefined();

    // AND check if constants are defined in it
    const Constants = skillGroupGETParentModule.default.GET.Constants;
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();

    // AND check if enums are defined
    const Enums = skillGroupGETParentModule.default.GET.Enums;
    expect(Enums.Relations.Parents.ObjectTypes).toBeDefined();
  });
  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const skillGroupGETParentModule = await import("./");
      expect(skillGroupGETParentModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});
