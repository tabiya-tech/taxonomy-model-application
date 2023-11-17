describe("Test the info module", () => {
  test("The info module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require("./");
      }).not.toThrowError();
      // AND check if Schema is defined in it
      expect(require("./").default.Schemas.GET.Response.Payload).toBeDefined();
    }).not.toThrowError();
  });

  test("The info module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(require("./").default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
