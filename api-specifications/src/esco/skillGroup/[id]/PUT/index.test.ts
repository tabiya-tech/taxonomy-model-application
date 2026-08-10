import PUTSkillGroupOperation from "./index";

describe("Test the PUTSkillGroupOperation index", () => {
  test("it should export the PUTSkillGroupOperation namespace", () => {
    expect(PUTSkillGroupOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PUTSkillGroupOperation.Schemas).toBeDefined();
    expect(PUTSkillGroupOperation.Schemas.Response.Payload).toBeDefined();
    expect(PUTSkillGroupOperation.Schemas.Request.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PUTSkillGroupOperation.Errors).toBeDefined();
  });
});
