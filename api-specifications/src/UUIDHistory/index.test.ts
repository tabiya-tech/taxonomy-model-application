describe("Test the UUIDHistory module", () => {
  test("The UUIDHistory module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required vua index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const UUIDHistoryModule = await import("./");

    // THEN check if schemas is defined in it
    expect(UUIDHistoryModule.default.Schemas.GET.Response).toBeDefined();
    expect(UUIDHistoryModule.default.Schemas.GET.Request).toBeDefined();
    // AND check if constants are defined in it
    const Constants = UUIDHistoryModule.default.Constants;
    expect(Constants.NAME_MAX_LENGTH).toBeDefined();
    expect(Constants.VERSION_MAX_LENGTH).toBeDefined();
    expect(Constants.LOCALE_SHORTCODE_MAX_LENGTH).toBeDefined();
  });

  test("The export module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const UUIDHistoryModule = await import("./");
      expect(UUIDHistoryModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
