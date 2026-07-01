import GETOccupationHistoryOperation from "./index";

describe("Test the GETOccupationHistoryOperation index", () => {
  test("it should export the GETOccupationHistoryOperation namespace", () => {
    expect(GETOccupationHistoryOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETOccupationHistoryOperation.Schemas).toBeDefined();
    expect(GETOccupationHistoryOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(GETOccupationHistoryOperation.Errors).toBeDefined();
  });
});
