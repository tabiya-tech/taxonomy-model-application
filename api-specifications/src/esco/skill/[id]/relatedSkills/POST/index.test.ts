import POSTSkillRelatedOperation from "./index";

describe("Test the POSTSkillRelatedOperation index", () => {
  test("it should export the POSTSkillRelatedOperation namespace", () => {
    expect(POSTSkillRelatedOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(POSTSkillRelatedOperation.Schemas).toBeDefined();
    expect(POSTSkillRelatedOperation.Schemas.Request.Payload).toBeDefined();
    expect(POSTSkillRelatedOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(POSTSkillRelatedOperation.Errors).toBeDefined();
  });
});
