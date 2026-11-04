import DELETEOccupationGroupByIdOperation from "./index";

describe("Test the DELETEOccupationGroupByIdOperation index", () => {
  test("it should export the DELETEOccupationGroupByIdOperation namespace", () => {
    expect(DELETEOccupationGroupByIdOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(DELETEOccupationGroupByIdOperation.Schemas).toBeDefined();
    expect(DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(DELETEOccupationGroupByIdOperation.Errors).toBeDefined();
  });
});
