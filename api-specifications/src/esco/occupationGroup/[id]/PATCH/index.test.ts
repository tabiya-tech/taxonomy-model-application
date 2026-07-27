import PATCHOccupationGroupOperation from "./index";

describe("Test the PATCHOccupationGroupOperation index", () => {
  test("it should export the PATCHOccupationGroupOperation namespace", () => {
    expect(PATCHOccupationGroupOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PATCHOccupationGroupOperation.Schemas).toBeDefined();
    expect(PATCHOccupationGroupOperation.Schemas.Response.Payload).toBeDefined();
    expect(PATCHOccupationGroupOperation.Schemas.Request.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PATCHOccupationGroupOperation.Errors).toBeDefined();
  });
});
