import { getOccupationGroupChildrenPathParameters } from "./query";

describe("getOccupationGroupChildrenPathParameters()", () => {
  test("parses the children route path parameters", () => {
    expect(getOccupationGroupChildrenPathParameters("/models/model-123/occupationGroups/group-456/children")).toEqual({
      modelId: "model-123",
      id: "group-456",
    });
  });
});
