import PUTOccupationGroupOperation from "./index";

describe("Test the PUTOccupationGroupOperation index", () => {
  test("it should export the PUTOccupationGroupOperation namespace", () => {
    expect(PUTOccupationGroupOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PUTOccupationGroupOperation.Schemas).toBeDefined();
    expect(PUTOccupationGroupOperation.Schemas.Response.Payload).toBeDefined();
    expect(PUTOccupationGroupOperation.Schemas.Request.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PUTOccupationGroupOperation.Errors).toBeDefined();
  });
});
