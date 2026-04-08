import GETSkillOccupationsOperation from "./index";

describe("Test the GETSkillOccupationsOperation index", () => {
  test("it should export the GETSkillOccupationsOperation namespace", () => {
    expect(GETSkillOccupationsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETSkillOccupationsOperation.Schemas).toBeDefined();
    expect(GETSkillOccupationsOperation.Schemas.Response.Payload).toBeDefined();
    expect(GETSkillOccupationsOperation.Schemas.Request.Query.Payload).toBeDefined();
  });
});
