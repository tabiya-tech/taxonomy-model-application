describe("Test the skillGroup GET children module", () => {
  test("The skillGroup GET children module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const skillGroupGETChildrenModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(skillGroupGETChildrenModule.default.GET.Schemas.Response.Child.Payload).toBeDefined();
    expect(skillGroupGETChildrenModule.default.GET.Schemas.Response.Children.Payload).toBeDefined();

    // AND check if constants are defined in it
    const Constants = skillGroupGETChildrenModule.default.GET.Constants;
    expect(Constants.DEFAULT_LIMIT).toBeDefined();
    expect(Constants.MAX_LIMIT).toBeDefined();
    expect(Constants.MAX_CURSOR_LENGTH).toBeDefined();

    // AND check if enums are defined
    const Enums = skillGroupGETChildrenModule.default.GET.Enums;
    expect(Enums.ObjectTypes).toBeDefined();
  });
  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const skillGroupGETChildrenModule = await import("./");
      expect(skillGroupGETChildrenModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});
