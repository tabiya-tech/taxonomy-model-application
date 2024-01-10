describe("Test the importProcessState module", () => {
  test("The importProcessState module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      const importProcessStateModule = await import("./");
      // AND check if Schema is defined in it
      expect(importProcessStateModule.default.Schemas.GET.Response.Payload).toBeDefined();
      // AND check if the enums are defined in it
      expect(importProcessStateModule.default.Enums.Status).toBeDefined();
    }).not.toThrowError();
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
