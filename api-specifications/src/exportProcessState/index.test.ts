describe("Test the exportProcessState module", () => {
  test("The exportProcessState module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      const exportProcessStateModule = require("./").default;
      // AND check if Schema is defined in it
      expect(exportProcessStateModule.Schemas.GET.Response.Payload).toBeDefined();
      // AND check if the enums are defined in it
      expect(exportProcessStateModule.Enums.Status).toBeDefined();
    }).not.toThrowError();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(require("./").default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
