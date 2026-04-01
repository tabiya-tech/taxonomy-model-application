describe("Test the occupationGroup GET parent module", () => {
  test("The occupationGroup GET parent module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const occupationGroupGETParentModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(occupationGroupGETParentModule.default.GET.Schemas.Response.Payload).toBeDefined();

    // AND check if constants are defined in it
    const Constants = occupationGroupGETParentModule.default.GET.Constants;
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();

    // AND check if enums are defined
    const Enums = occupationGroupGETParentModule.default.GET.Enums;
    expect(Enums.Relations.Parent.ObjectTypes).toBeDefined();
  });
  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const occupationGroupGETParentModule = await import("./");
      expect(occupationGroupGETParentModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});
