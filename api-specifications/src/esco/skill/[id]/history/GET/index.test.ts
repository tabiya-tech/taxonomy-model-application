import GETSkillHistoryOperation from "./index";

describe("Test the GETSkillHistoryOperation index", () => {
  test("it should export the GETSkillHistoryOperation namespace", () => {
    expect(GETSkillHistoryOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETSkillHistoryOperation.Schemas).toBeDefined();
    expect(GETSkillHistoryOperation.Schemas.Response.Payload).toBeDefined();
  });
});
