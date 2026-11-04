import PATCHOccupationGroupParentOperation from "./index";

describe("Test the PATCHOccupationGroupParentOperation index", () => {
  test("it should export the PATCHOccupationGroupParentOperation namespace", () => {
    expect(PATCHOccupationGroupParentOperation).toBeDefined();
  });
  test("it should have the Schemas namespace defined", () => {
    expect(PATCHOccupationGroupParentOperation.Schemas).toBeDefined();
    expect(PATCHOccupationGroupParentOperation.Schemas.Request).toBeDefined();
    expect(PATCHOccupationGroupParentOperation.Schemas.Response).toBeDefined();
  });
  test("it should have the Enums namespace defined", () => {
    expect(PATCHOccupationGroupParentOperation.Enums).toBeDefined();
  });
  test("it should have the Constants namespace defined", () => {
    expect(PATCHOccupationGroupParentOperation.Constants).toBeDefined();
  });
});
