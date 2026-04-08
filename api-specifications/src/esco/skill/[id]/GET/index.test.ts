import GETSkillByIdOperation from "./index";

describe("Test the GETSkillByIdOperation index", () => {
  test("it should export the GETSkillByIdOperation namespace", () => {
    expect(GETSkillByIdOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETSkillByIdOperation.Schemas).toBeDefined();
    expect(GETSkillByIdOperation.Schemas.Response.Payload).toBeDefined();
    expect(GETSkillByIdOperation.Schemas.Request.Param.Payload).toBeDefined();
  });
});
