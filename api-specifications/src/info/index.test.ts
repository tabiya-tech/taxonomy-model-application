describe("Test the info module", () => {
  test("The info module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const infoModule = await import("./");

    // THEN check if Schema is defined in it
    expect(infoModule.default.Schemas.GET.Response.Payload).toBeDefined();
  });

  test("The info module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const infoModule = await import("./");
      expect(infoModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
