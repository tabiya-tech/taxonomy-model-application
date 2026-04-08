import POSTSkillOperation from "./index";

describe("Test the POSTSkillOperation index", () => {
  test("it should export the POSTSkillOperation namespace", () => {
    expect(POSTSkillOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(POSTSkillOperation.Schemas).toBeDefined();
    expect(POSTSkillOperation.Schemas.Request.Payload).toBeDefined();
    expect(POSTSkillOperation.Schemas.Request.Param.Payload).toBeDefined();
    expect(POSTSkillOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Constants and Enums namespaces defined", () => {
    expect(POSTSkillOperation.Constants).toBeDefined();
    expect(POSTSkillOperation.Enums).toBeDefined();
  });
});
