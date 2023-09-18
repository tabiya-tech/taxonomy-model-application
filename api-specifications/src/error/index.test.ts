describe("Test the error module", () => {
  test("The error module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require('./');
      }).not.toThrowError();
      let apiErrorModule = require('./').default;

      // AND check if Schema is defined in it
      expect(apiErrorModule.Schemas.Payload).toBeDefined();

      // AND check if all the Constants are defined
      const Constants = apiErrorModule.Constants;
      expect(Constants.ErrorCodes).toBeDefined();
      expect(Constants.ReasonPhrases).toBeDefined();
    }).not.toThrowError();
  })
})

export {}