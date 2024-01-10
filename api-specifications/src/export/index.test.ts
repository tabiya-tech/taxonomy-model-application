describe("Test the export module", () => {
  test("The export module can be required via the index", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      const exportModule = await import("./");
      // AND check if the various exports are defined
      expect(exportModule.default.Schemas.POST.Request.Payload).toBeDefined();
      expect(exportModule.default.Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
      expect(exportModule.default.Enums.POST).toBeDefined();
    }).not.toThrowError();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const exportModule = await import("./");
      expect(exportModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
