import PATCHSkillParentsOperation from "./index";

describe("Test the PATCHSkillParentsOperation index", () => {
  test("it should export the PATCHSkillParentsOperation namespace", () => {
    expect(PATCHSkillParentsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PATCHSkillParentsOperation.Schemas).toBeDefined();
    expect(PATCHSkillParentsOperation.Schemas.Request.Payload).toBeDefined();
    expect(PATCHSkillParentsOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PATCHSkillParentsOperation.Errors).toBeDefined();
  });
});
