import PUTOccupationOperation from "./index";

describe("Test the PUTOccupationOperation index", () => {
  test("it should export the PUTOccupationOperation namespace", () => {
    expect(PUTOccupationOperation).toBeDefined();
  });

  test("it should have the Schemas namespace defined", () => {
    expect(PUTOccupationOperation.Schemas).toBeDefined();
    expect(PUTOccupationOperation.Schemas.Response.Payload).toBeDefined();
    expect(PUTOccupationOperation.Schemas.Request.Payload).toBeDefined();
  });

  test("it should have the Errors namespace defined", () => {
    expect(PUTOccupationOperation.Errors).toBeDefined();
  });
});
