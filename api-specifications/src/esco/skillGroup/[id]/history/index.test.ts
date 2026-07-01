describe("Test the skillGroup GET history module", () => {
  test("The skillGroup GET history module can be required via the index", async () => {
    expect(async () => await import("./")).not.toThrow();
    const skillGroupGETHistoryModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(skillGroupGETHistoryModule.default.GET.Schemas.Response.Payload).toBeDefined();

    // AND check if enums are defined
    expect(skillGroupGETHistoryModule.default.GET.Enums).toBeDefined();
  });

  test("The export module matches the snapshot", async () => {
    const skillGroupGETHistoryModule = await import("./");
    expect(skillGroupGETHistoryModule.default).toMatchSnapshot();
  });
});
