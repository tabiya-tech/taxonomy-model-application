import PATCHOccupationParentOperation from "./index";

describe("Test the PATCHOccupationParentOperation index", () => {
  test("it should export the PATCHOccupationParentOperation namespace", () => {
    expect(PATCHOccupationParentOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PATCHOccupationParentOperation.Schemas).toBeDefined();
    expect(PATCHOccupationParentOperation.Schemas.Request.Payload).toBeDefined();
    expect(PATCHOccupationParentOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PATCHOccupationParentOperation.Errors).toBeDefined();
  });
});
