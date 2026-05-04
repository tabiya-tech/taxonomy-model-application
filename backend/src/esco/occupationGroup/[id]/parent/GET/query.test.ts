import { getOccupationGroupParentPathParameters } from "./query";

describe("getOccupationGroupParentPathParameters()", () => {
  test("parses the parent route path parameters", () => {
    expect(getOccupationGroupParentPathParameters("/models/model-123/occupationGroups/group-456/parent")).toEqual({
      modelId: "model-123",
      id: "group-456",
    });
  });
});
