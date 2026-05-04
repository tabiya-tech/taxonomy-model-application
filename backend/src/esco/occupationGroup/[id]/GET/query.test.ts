import { getOccupationGroupDetailPathParameters } from "./query";

describe("getOccupationGroupDetailPathParameters()", () => {
  test("parses the detail route path parameters", () => {
    const actual = getOccupationGroupDetailPathParameters("/models/model-123/occupationGroups/group-456");

    expect(actual).toEqual({
      modelId: "model-123",
      id: "group-456",
    });
  });
});
