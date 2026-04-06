describe("Test the skillGroup GET parent operation module", () => {
  test("The skillGroup GET parent operation module can be required via the index", async () => {
    expect(async () => await import("./")).not.toThrow();
    const module = await import("./");

    expect(module.default.Schemas.Response.Payload).toBeDefined();

    const Constants = module.default.Constants;
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
  });

  test("The export module matches the snapshot", async () => {
    const module = await import("./");
    expect(module.default).toMatchSnapshot();
  });
});
