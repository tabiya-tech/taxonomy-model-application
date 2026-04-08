import GETSkillsOperation from "./index";

describe("Test the GETSkillsOperation index", () => {
  test("it should export the GETSkillsOperation namespace", () => {
    expect(GETSkillsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETSkillsOperation.Schemas).toBeDefined();
    expect(GETSkillsOperation.Schemas.Response.Payload).toBeDefined();
    expect(GETSkillsOperation.Schemas.Request.Param.Payload).toBeDefined();
    expect(GETSkillsOperation.Schemas.Request.Query.Payload).toBeDefined();
  });

  test("it should have the Enums namespace defined", () => {
    expect(GETSkillsOperation.Enums).toBeDefined();
  });
});
