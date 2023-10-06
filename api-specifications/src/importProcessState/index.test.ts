describe("Test the importProcessState module", () => {
  test("The importProcessState module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      const importProcessStateModule = require("./").default;
      // AND check if Schema is defined in it
      expect(
        importProcessStateModule.Schemas.GET.Response.Payload
      ).toBeDefined();
      // AND check if the enums are defined in it
      expect(importProcessStateModule.Enums.Status).toBeDefined();
    }).not.toThrowError();
  });
});

export {};
