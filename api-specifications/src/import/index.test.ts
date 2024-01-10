describe("Test the import module", () => {
  test("The import module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const importModule = await import("./");

    // THEN Check if Schema is defined in it
    expect(importModule.default.Schemas.POST.Request.Payload).toBeDefined();
    // AND Check if the various exports are defined in it
    expect(importModule.default.Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
    expect(importModule.default.Enums.POST).toBeDefined();
  });

  test("The import module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const importModule = await import("./");
      expect(importModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
