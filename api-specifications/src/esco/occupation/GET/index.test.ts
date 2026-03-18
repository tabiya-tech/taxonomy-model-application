import GETOccupationsOperation from "./index";

describe("Test the GETOccupationsOperation index", () => {
  test("it should export the GETOccupationsOperation namespace", () => {
    expect(GETOccupationsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETOccupationsOperation.Schemas).toBeDefined();
    expect(GETOccupationsOperation.Schemas.Response.Payload).toBeDefined();
    expect(GETOccupationsOperation.Schemas.Request.Param.Payload).toBeDefined();
    expect(GETOccupationsOperation.Schemas.Request.Query.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(GETOccupationsOperation.Errors).toBeDefined();
  });
});
