import POSTOccupationParentOperation from "./index";

describe("Test the POSTOccupationParentOperation index", () => {
  test("it should export the POSTOccupationParentOperation namespace", () => {
    expect(POSTOccupationParentOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(POSTOccupationParentOperation.Schemas).toBeDefined();
    expect(POSTOccupationParentOperation.Schemas.Request.Payload).toBeDefined();
    expect(POSTOccupationParentOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(POSTOccupationParentOperation.Errors).toBeDefined();
  });
});
