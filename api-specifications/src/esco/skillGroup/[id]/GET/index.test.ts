describe("Test the skillGroup GET Detail module", () => {
  test("The skillGroup GET Detail module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const skillGroupGETDetailModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(skillGroupGETDetailModule.default.Schemas.Response.Payload).toBeDefined();
  });
  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const skillGroupGETDetailModule = await import("./");
      expect(skillGroupGETDetailModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});
