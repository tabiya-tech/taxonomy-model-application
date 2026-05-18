import { getOccupationGroupsPathParameters, encodeCursor, decodeCursor } from "./query";
describe("getOccupationGroupsPathParameters()", () => {
  test("parses the list route path parameters", () => {
    const actual = getOccupationGroupsPathParameters("/models/model-123/occupationGroups");

    expect(actual).toEqual({
      modelId: "model-123",
    });
  });
});

describe("encodeCursor() and decodeCursor()", () => {
  test("encodes and decodes the cursor correctly", () => {
    const id = "group-456";
    const createdAt = new Date("2024-01-01T00:00:00Z");

    const encodedCursor = encodeCursor(id, createdAt);
    const decodedCursor = decodeCursor(encodedCursor);

    expect(decodedCursor).toEqual({
      id,
      createdAt,
    });
  });
});
