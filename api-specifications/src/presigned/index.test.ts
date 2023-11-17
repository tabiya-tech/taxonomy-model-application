describe("Test the presigned module", () => {
  test("The presigned module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      const presignedModule = require("./").default;
      // AND the schema should be defined
      expect(presignedModule.Schemas.GET.Response.Payload).toBeDefined();

      // AND the constants should be defined
      const Constants = presignedModule.Constants;
      expect(Constants.EXPIRES).toBeDefined();
      expect(Constants.MAX_FILE_SIZE).toBeDefined();
    }).not.toThrowError();
  });

  test("The presigned module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(require("./").default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
