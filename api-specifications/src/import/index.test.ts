describe("Test the import module", () => {
  test("The import module can be required via the index", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      // AND check if Schema is defined in it
      expect(require("./").default.Schemas.POST.Request.Payload).toBeDefined();
    }).not.toThrowError();
  });

  test("The import module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(require("./").default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
