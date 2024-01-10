describe("Test the presigned module", () => {
  test("The presigned module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const presignedModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(presignedModule.default.Schemas.GET.Response.Payload).toBeDefined();
    // AND check if constants are defined in it
    const Constants = presignedModule.default.Constants;
    expect(Constants.EXPIRES).toBeDefined();
    expect(Constants.MAX_FILE_SIZE).toBeDefined();
  });

  test("The presigned module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const presignedModule = await import("./");
      expect(presignedModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
