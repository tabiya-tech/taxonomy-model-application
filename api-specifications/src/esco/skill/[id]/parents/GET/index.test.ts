import GETSkillParentsOperation from "./index";

describe("Test the GETSkillParentsOperation index", () => {
  test("it should export the GETSkillParentsOperation namespace", () => {
    expect(GETSkillParentsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETSkillParentsOperation.Schemas).toBeDefined();
    expect(GETSkillParentsOperation.Schemas.Response.Payload).toBeDefined();
    expect(GETSkillParentsOperation.Schemas.Request.Query.Payload).toBeDefined();
  });
});
