import GETSkillChildrenOperation from "./index";

describe("Test the GETSkillChildrenOperation index", () => {
  test("it should export the GETSkillChildrenOperation namespace", () => {
    expect(GETSkillChildrenOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETSkillChildrenOperation.Schemas).toBeDefined();
    expect(GETSkillChildrenOperation.Schemas.Response.Payload).toBeDefined();
    expect(GETSkillChildrenOperation.Schemas.Request.Query.Payload).toBeDefined();
  });
});
