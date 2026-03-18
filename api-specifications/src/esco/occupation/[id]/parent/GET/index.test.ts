import GETOccupationParentsOperation from "./index";

describe("Test the GETOccupationParentsOperation index", () => {
  test("it should export the GETOccupationParentsOperation namespace", () => {
    expect(GETOccupationParentsOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(GETOccupationParentsOperation.Schemas).toBeDefined();
    expect(GETOccupationParentsOperation.Schemas.Response.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(GETOccupationParentsOperation.Errors).toBeDefined();
  });
});
