describe("Test the exportProcessState module", () => {
  test("The exportProcessState module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      const exportProcessStateModule = await import("./");
      // AND check if Schema is defined in it
      expect(exportProcessStateModule.default.Schemas.GET.Response.Payload).toBeDefined();
      // AND check if the enums are defined in it
      expect(exportProcessStateModule.default.Enums.Status).toBeDefined();
    }).not.toThrowError();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const exportProcessStateModule = await import("./");
      expect(exportProcessStateModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
