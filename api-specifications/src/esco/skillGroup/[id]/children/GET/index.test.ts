describe("Test the skillGroup GET children operation module", () => {
  test("The skillGroup GET children operation module can be required via the index", async () => {
    expect(async () => await import("./")).not.toThrow();
    const module = await import("./");

    expect(module.default.Schemas.Response.Child.Payload).toBeDefined();
    expect(module.default.Schemas.Response.Children.Payload).toBeDefined();

    const Constants = module.default.Constants;
    expect(Constants.DEFAULT_LIMIT).toBeDefined();
    expect(Constants.MAX_LIMIT).toBeDefined();
    expect(Constants.MAX_CURSOR_LENGTH).toBeDefined();
  });

  test("The export module matches the snapshot", async () => {
    const module = await import("./");
    expect(module.default).toMatchSnapshot();
  });
});
