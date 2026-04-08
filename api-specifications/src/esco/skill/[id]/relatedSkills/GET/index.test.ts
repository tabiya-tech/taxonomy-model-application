import GETRelatedSkillsOperation from "./index";

describe("Test the GETRelatedSkillsOperation index", () => {
  test("it should export the GETRelatedSkillsOperation namespace", () => {
    expect(GETRelatedSkillsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETRelatedSkillsOperation.Schemas).toBeDefined();
    expect(GETRelatedSkillsOperation.Schemas.Response.Payload).toBeDefined();
    expect(GETRelatedSkillsOperation.Schemas.Request.Query.Payload).toBeDefined();
  });
});
