import POSTSkillGroupParentOperation from "./index";

describe("Test the POSTSkillGroupParentOperation index", () => {
  test("it should export the POSTSkillGroupParentOperation namespace", () => {
    expect(POSTSkillGroupParentOperation).toBeDefined();
  });
  test("it should have the Schemas namespace defined", () => {
    expect(POSTSkillGroupParentOperation.Schemas).toBeDefined();
    expect(POSTSkillGroupParentOperation.Schemas.Request).toBeDefined();
    expect(POSTSkillGroupParentOperation.Schemas.Response).toBeDefined();
  });
  test("it should have the Enums namespace defined", () => {
    expect(POSTSkillGroupParentOperation.Enums).toBeDefined();
  });
});
