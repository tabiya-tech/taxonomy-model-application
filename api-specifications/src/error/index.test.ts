describe("Test the error module", () => {
  test("The error module can be required via the index", async () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const apiErrorModule = await import("./");

    // THEN Check if Schema is defined in it
    expect(apiErrorModule.default.Schemas.Payload).toBeDefined();

    // AND check if all the constants are defined
    const constants = apiErrorModule.default.Constants;
    expect(constants).toBeDefined();
    expect(constants.ErrorCodes).toBeDefined();
    expect(constants.ReasonPhrases).toBeDefined();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const apiErrorModule = await import("./");
      expect(apiErrorModule.default).toMatchSnapshot();
    }).not.toThrow();
  });
});

export {};
