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
});
