describe("Test the export module", () => {
  test("The export module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const exportModule = await import("./");

    // THEN Check if Schema is defined in it
    expect(exportModule.default.Schemas.POST.Request.Payload).toBeDefined();
    // AND check if the various exports are defined
    expect(exportModule.default.Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
    expect(exportModule.default.Enums.POST).toBeDefined();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const exportModule = await import("./");
      expect(exportModule.default).toMatchSnapshot();
    }).not.toThrow();
  });
});

export {};
