describe("Test the importProcessState module", () => {
  test("The importProcessState module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const importProcessStateModule = await import("./");

    // THEN check if Schema is defined in it
    expect(importProcessStateModule.default.Schemas.GET.Response.Payload).toBeDefined();
    // AND check if the enums are defined in it
    expect(importProcessStateModule.default.Enums.Status).toBeDefined();
  });

  test("The import module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const importProcessStateModule = await import("./");
      expect(importProcessStateModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
