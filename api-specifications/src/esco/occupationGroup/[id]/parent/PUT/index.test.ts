import PUTOccupationGroupParentOperation from "./index";

describe("Test the PUTOccupationGroupParentOperation index", () => {
  test("it should export the PUTOccupationGroupParentOperation namespace", () => {
    expect(PUTOccupationGroupParentOperation).toBeDefined();
  });
  test("it should have the Schemas namespace defined", () => {
    expect(PUTOccupationGroupParentOperation.Schemas).toBeDefined();
    expect(PUTOccupationGroupParentOperation.Schemas.Request).toBeDefined();
    expect(PUTOccupationGroupParentOperation.Schemas.Response).toBeDefined();
  });
  test("it should have the Enums namespace defined", () => {
    expect(PUTOccupationGroupParentOperation.Enums).toBeDefined();
  });
  test("it should have the Constants namespace defined", () => {
    expect(PUTOccupationGroupParentOperation.Constants).toBeDefined();
  });
});
