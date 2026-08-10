import PATCHSkillGroupOperation from "./index";

describe("Test the PATCHSkillGroupOperation index", () => {
  test("it should export the PATCHSkillGroupOperation namespace", () => {
    expect(PATCHSkillGroupOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PATCHSkillGroupOperation.Schemas).toBeDefined();
    expect(PATCHSkillGroupOperation.Schemas.Response.Payload).toBeDefined();
    expect(PATCHSkillGroupOperation.Schemas.Request.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PATCHSkillGroupOperation.Errors).toBeDefined();
  });
});
