import GETOccupationSkillsOperation from "./index";

describe("Test the GETOccupationSkillsOperation index", () => {
  test("it should export the GETOccupationSkillsOperation namespace", () => {
    expect(GETOccupationSkillsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETOccupationSkillsOperation.Schemas).toBeDefined();
    expect(GETOccupationSkillsOperation.Schemas.Response.Payload).toBeDefined();
    expect(GETOccupationSkillsOperation.Schemas.Request.Query.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(GETOccupationSkillsOperation.Errors).toBeDefined();
  });
});
