import POSTOccupationGroupParentOperation from "./index";

describe("Test the POSTOccupationGroupParentOperation index", () => {
  test("it should export the POSTOccupationGroupParentOperation namespace", () => {
    expect(POSTOccupationGroupParentOperation).toBeDefined();
  });
  test("it should have the Schemas namespace defined", () => {
    expect(POSTOccupationGroupParentOperation.Schemas).toBeDefined();
    expect(POSTOccupationGroupParentOperation.Schemas.Request).toBeDefined();
    expect(POSTOccupationGroupParentOperation.Schemas.Response).toBeDefined();
  });
  test("it should have the Enums namespace defined", () => {
    expect(POSTOccupationGroupParentOperation.Enums).toBeDefined();
  });
});
