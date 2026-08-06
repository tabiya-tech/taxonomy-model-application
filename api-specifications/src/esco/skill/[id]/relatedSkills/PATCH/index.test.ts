import PATCHSkillRelatedOperation from "./index";

describe("Test the PATCHSkillRelatedOperation index", () => {
  test("it should export the PATCHSkillRelatedOperation namespace", () => {
    expect(PATCHSkillRelatedOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PATCHSkillRelatedOperation.Schemas).toBeDefined();
    expect(PATCHSkillRelatedOperation.Schemas.Request.Payload).toBeDefined();
    expect(PATCHSkillRelatedOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PATCHSkillRelatedOperation.Errors).toBeDefined();
  });
});
