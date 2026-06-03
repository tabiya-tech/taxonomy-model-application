import POSTOccupationSkillsOperation from "./index";

describe("Test the POSTOccupationSkillsOperation index", () => {
  test("it should export the POSTOccupationSkillsOperation namespace", () => {
    expect(POSTOccupationSkillsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(POSTOccupationSkillsOperation.Schemas).toBeDefined();
    expect(POSTOccupationSkillsOperation.Schemas.Request.Payload).toBeDefined();
    expect(POSTOccupationSkillsOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(POSTOccupationSkillsOperation.Errors).toBeDefined();
  });
});
