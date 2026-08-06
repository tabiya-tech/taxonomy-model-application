import PATCHSkillOccupationsOperation from "./index";

describe("Test the PATCHSkillOccupationsOperation index", () => {
  test("it should export the PATCHSkillOccupationsOperation namespace", () => {
    expect(PATCHSkillOccupationsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PATCHSkillOccupationsOperation.Schemas).toBeDefined();
    expect(PATCHSkillOccupationsOperation.Schemas.Request.Payload).toBeDefined();
    expect(PATCHSkillOccupationsOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PATCHSkillOccupationsOperation.Errors).toBeDefined();
  });
});
