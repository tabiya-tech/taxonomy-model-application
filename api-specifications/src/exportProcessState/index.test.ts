describe("Test the exportProcessState module", () => {
  test("The exportProcessState module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const exportProcessStateModule = await import("./");

    // THEN check if Schema is defined in it
    expect(exportProcessStateModule.default.Schemas.GET.Response.Payload).toBeDefined();
    // AND check if the enums are defined in it
    expect(exportProcessStateModule.default.Enums.Status).toBeDefined();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const exportProcessStateModule = await import("./");
      expect(exportProcessStateModule.default).toMatchSnapshot();
    }).not.toThrow();
  });
});

export {};
