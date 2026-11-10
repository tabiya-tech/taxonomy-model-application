import PUTModelOperation from "./index";

describe("Test the PUTModelOperation index", () => {
  test("it should export the PUTModelOperation namespace", () => {
    expect(PUTModelOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PUTModelOperation.Schemas).toBeDefined();
    expect(PUTModelOperation.Schemas.Request.Payload).toBeDefined();
    expect(PUTModelOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Enums namespace defined", () => {
    expect(PUTModelOperation.Enums).toBeDefined();
  });

  test("it should have the Constants namespace defined", () => {
    expect(PUTModelOperation.Constants).toBeDefined();
    expect(PUTModelOperation.Constants.MAX_PUT_PAYLOAD_LENGTH).toBeDefined();
    expect(PUTModelOperation.Constants.UUID_HISTORY_MAX_ITEMS).toBeDefined();
  });

  test("UUID history payload length includes JSON quotes, commas, and brackets", () => {
    const maxUUID = "a".repeat(PUTModelOperation.Constants.UUID_HISTORY_ITEM_MAX_LENGTH);
    const serializedUUIDHistory = JSON.stringify(
      Array(PUTModelOperation.Constants.UUID_HISTORY_MAX_ITEMS).fill(maxUUID)
    );

    expect(PUTModelOperation.Constants.TOTAL_UUID_HISTORY_MAX_LENGTH).toEqual(serializedUUIDHistory.length);
  });
});
