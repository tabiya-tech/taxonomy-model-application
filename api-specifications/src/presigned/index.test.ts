describe("Test the presigned module", () => {
  test("The presigned module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      const presignedModule = await import("./");
      // AND the schema should be defined
      expect(presignedModule.default.Schemas.GET.Response.Payload).toBeDefined();

      // AND the constants should be defined
      const Constants = presignedModule.default.Constants;
      expect(Constants.EXPIRES).toBeDefined();
      expect(Constants.MAX_FILE_SIZE).toBeDefined();
    }).not.toThrowError();
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
