import DELETEOccupationByIdOperation from "./index";

describe("Test the DELETEOccupationByIdOperation index", () => {
  test("it should export the DELETEOccupationByIdOperation namespace", () => {
    expect(DELETEOccupationByIdOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(DELETEOccupationByIdOperation.Schemas).toBeDefined();
    expect(DELETEOccupationByIdOperation.Schemas.Request.Param.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(DELETEOccupationByIdOperation.Errors).toBeDefined();
  });
});
