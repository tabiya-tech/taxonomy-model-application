describe("Test the auth module", () => {
  test("The auth module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const authModule = await import("./");

    // THEN check if Schema is defined in it
    expect(authModule.default.Schemas.Request.Context).toBeDefined();
  });

  test("The auth module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const authModule = await import("./");
      expect(authModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
