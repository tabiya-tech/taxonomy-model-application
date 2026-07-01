describe("Test the Skill History module", () => {
  test("The Skill History module can be required via the index", async () => {
    expect(async () => await import("./")).not.toThrow();

    const module = await import("./");

    expect(module.default.GET.Schemas.Response.Payload).toBeDefined();
    expect(module.default.Constants).toBeDefined();
    expect(module.default.Enums).toBeDefined();
  });
});
