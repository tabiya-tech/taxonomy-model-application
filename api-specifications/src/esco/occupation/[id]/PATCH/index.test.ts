import PATCHOccupationOperation from "./index";

describe("Test the PATCHOccupationOperation index", () => {
  test("it should export the PATCHOccupationOperation namespace", () => {
    expect(PATCHOccupationOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PATCHOccupationOperation.Schemas).toBeDefined();
    expect(PATCHOccupationOperation.Schemas.Response.Payload).toBeDefined();
    expect(PATCHOccupationOperation.Schemas.Request.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PATCHOccupationOperation.Errors).toBeDefined();
  });
});
