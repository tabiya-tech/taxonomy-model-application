describe("Test the Occupation Parent Instance Detail module", () => {
  test("The Occupation Parent Instance Detail module can be required via the index", async () => {
    // GIVEN the module
    expect(async () => await import("./")).not.toThrow();

    const module = await import("./");

    // THEN check if Schemas are defined
    expect(module.default.GET.Schemas.Response.Payload).toBeDefined();

    // AND check if constants are defined
    const Constants = module.default.Constants;
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
    // MAX_POST_PAYLOAD_LENGTH is POST-specific, accessible via OccupationAPISpecs.POSTOccupation.Constants

    // AND check if Enums are defined
    const Enums = module.default.Enums;
    expect(Enums).toBeDefined();
    expect(Enums.OccupationType).toBeDefined();
  });

  test("The export module matches the snapshot", async () => {
    const module = await import("./");
    expect(module.default).toMatchSnapshot();
  });
});
