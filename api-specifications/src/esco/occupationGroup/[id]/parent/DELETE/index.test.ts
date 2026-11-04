import DELETEOccupationGroupParentOperation from "./index";

describe("Test the DELETEOccupationGroupParentOperation index", () => {
  test("it should export the DELETEOccupationGroupParentOperation namespace", () => {
    expect(DELETEOccupationGroupParentOperation).toBeDefined();
  });
  test("it should have the Schemas namespace defined", () => {
    expect(DELETEOccupationGroupParentOperation.Schemas).toBeDefined();
    expect(DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload).toBeDefined();
  });
  test("it should have the Enums namespace defined", () => {
    expect(DELETEOccupationGroupParentOperation.Enums).toBeDefined();
  });
});
