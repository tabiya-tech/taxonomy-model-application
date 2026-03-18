import GETOccupationByIdOperation from "./index";

describe("Test the GETOccupationByIdOperation index", () => {
  test("it should export the GETOccupationByIdOperation namespace", () => {
    expect(GETOccupationByIdOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETOccupationByIdOperation.Schemas).toBeDefined();
    expect(GETOccupationByIdOperation.Schemas.Request.Param.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(GETOccupationByIdOperation.Errors).toBeDefined();
  });
});
