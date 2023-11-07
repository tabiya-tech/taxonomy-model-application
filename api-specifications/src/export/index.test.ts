describe("Test the export module", () => {
  test("The export module can be required via the index", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      // AND check if the various exports are defined
      expect(require("./").default.Schemas.POST.Request.Payload).toBeDefined();
      expect(require("./").default.Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
      expect(require("./").default.Enums.POST).toBeDefined();
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
