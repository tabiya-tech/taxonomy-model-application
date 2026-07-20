import PATCHSkillOperation from "./index";

describe("Test the PATCHSkillOperation index", () => {
  test("it should export the PATCHSkillOperation namespace", () => {
    expect(PATCHSkillOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PATCHSkillOperation.Schemas).toBeDefined();
    expect(PATCHSkillOperation.Schemas.Response.Payload).toBeDefined();
    expect(PATCHSkillOperation.Schemas.Request.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PATCHSkillOperation.Errors).toBeDefined();
  });
});
