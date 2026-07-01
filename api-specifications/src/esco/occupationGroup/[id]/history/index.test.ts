describe("Test the occupationGroup GET history module", () => {
  test("The occupationGroup GET history module can be required via the index", async () => {
    expect(async () => await import("./")).not.toThrow();
    const occupationGroupGETHistoryModule = await import("./");

    // THEN check if Schemas is defined in it
    expect(occupationGroupGETHistoryModule.default.GET.Schemas.Response.Payload).toBeDefined();

    // AND check if enums are defined
    expect(occupationGroupGETHistoryModule.default.GET.Enums).toBeDefined();
  });

  test("The export module matches the snapshot", async () => {
    const occupationGroupGETHistoryModule = await import("./");
    expect(occupationGroupGETHistoryModule.default).toMatchSnapshot();
  });
});
