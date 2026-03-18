import POSTOccupationOperation from "./index";

describe("Test the POSTOccupationOperation index", () => {
  test("it should export the POSTOccupationOperation namespace", () => {
    expect(POSTOccupationOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(POSTOccupationOperation.Schemas).toBeDefined();
    expect(POSTOccupationOperation.Schemas.Response.Payload).toBeDefined();
    expect(POSTOccupationOperation.Schemas.Request.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(POSTOccupationOperation.Errors).toBeDefined();
  });
});
