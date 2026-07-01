describe("Test the occupationGroup GET history operation module", () => {
  test("The occupationGroup GET history operation module can be required via the index", async () => {
    expect(async () => await import("./")).not.toThrow();
    const module = await import("./");

    expect(module.default.Schemas.Response.Payload).toBeDefined();
    expect(module.default.Enums).toBeDefined();
  });

  test("The export module matches the snapshot", async () => {
    const module = await import("./");
    expect(module.default).toMatchSnapshot();
  });
});
