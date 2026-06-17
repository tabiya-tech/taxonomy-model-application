import POSTSkillParentsOperation from "./index";

describe("Test the POSTSkillParentsOperation index", () => {
  test("it should export the POSTSkillParentsOperation namespace", () => {
    expect(POSTSkillParentsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(POSTSkillParentsOperation.Schemas).toBeDefined();
    expect(POSTSkillParentsOperation.Schemas.Request.Payload).toBeDefined();
    expect(POSTSkillParentsOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(POSTSkillParentsOperation.Errors).toBeDefined();
  });
});
