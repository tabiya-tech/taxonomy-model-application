import PUTSkillOperation from "./index";

describe("Test the PUTSkillOperation index", () => {
  test("it should export the PUTSkillOperation namespace", () => {
    expect(PUTSkillOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PUTSkillOperation.Schemas).toBeDefined();
    expect(PUTSkillOperation.Schemas.Response.Payload).toBeDefined();
    expect(PUTSkillOperation.Schemas.Request.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PUTSkillOperation.Errors).toBeDefined();
  });
});
