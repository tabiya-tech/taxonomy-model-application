import GETOccupationChildrenOperation from "./index";

describe("Test the GETOccupationChildrenOperation index", () => {
  test("it should export the GETOccupationChildrenOperation namespace", () => {
    expect(GETOccupationChildrenOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETOccupationChildrenOperation.Schemas).toBeDefined();
    expect(GETOccupationChildrenOperation.Schemas.Response.Payload).toBeDefined();
    expect(GETOccupationChildrenOperation.Schemas.Request.Query.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(GETOccupationChildrenOperation.Errors).toBeDefined();
  });
});
