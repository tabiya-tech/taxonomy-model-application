import POSTSkillOccupationsOperation from "./index";

describe("Test the POSTSkillOccupationsOperation index", () => {
  test("it should export the POSTSkillOccupationsOperation namespace", () => {
    expect(POSTSkillOccupationsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(POSTSkillOccupationsOperation.Schemas).toBeDefined();
    expect(POSTSkillOccupationsOperation.Schemas.Request.Payload).toBeDefined();
    expect(POSTSkillOccupationsOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(POSTSkillOccupationsOperation.Errors).toBeDefined();
  });
});
