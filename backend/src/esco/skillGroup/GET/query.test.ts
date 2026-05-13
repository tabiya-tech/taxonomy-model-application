import { getMockStringId } from "_test_utilities/mockMongoId";
import { decodeCursor, encodeCursor, getSkillGroupsPathParameters } from "./query";

describe("skillGroup GET query helpers", () => {
  test("getSkillGroupsPathParameters parses the model route", () => {
    const modelId = getMockStringId(1);
    expect(getSkillGroupsPathParameters(`/models/${modelId}/skillGroups`)).toEqual({ modelId });
  });

  test("encodeCursor and decodeCursor round-trip", () => {
    const cursor = encodeCursor("abc123", new Date("2024-02-03T04:05:06.000Z"));
    const decoded = decodeCursor(cursor);

    expect(decoded).toEqual({
      id: "abc123",
      createdAt: new Date("2024-02-03T04:05:06.000Z"),
    });
  });
});
