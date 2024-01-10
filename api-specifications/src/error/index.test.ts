describe("Test the error module", () => {
  test("The error module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      const apiErrorModule = await import("./");
      // AND check if Schema is defined in it
      expect(apiErrorModule.default.Schemas.Payload).toBeDefined();

      // AND check if all the Constants are defined
      const Constants = apiErrorModule.default.Constants;
      expect(Constants.ErrorCodes).toBeDefined();
      expect(Constants.ReasonPhrases).toBeDefined();
    }).not.toThrowError();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const apiErrorModule = await import("./");
      expect(apiErrorModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
