import { ObjectTypes } from "esco/common/objectTypes";
import { transform } from "./response";

describe("transform()", () => {
  test("maps a single occupation group into the API response shape", () => {
    const actual = transform(
      {
        id: "group-123",
        UUID: "uuid-123",
        UUIDHistory: ["origin-uuid", "uuid-123"],
        code: "123",
        originUri: "https://example.com/origin",
        preferredLabel: "Group label",
        altLabels: ["Alt label"],
        groupType: ObjectTypes.ISCOGroup,
        description: "Group description",
        parent: null,
        children: [],
        importId: "import-1",
        modelId: "model-123",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      },
      "https://api.example.com"
    );

    expect(actual).toEqual(
      expect.objectContaining({
        id: "group-123",
        UUID: "uuid-123",
        originUUID: "uuid-123",
        path: "https://api.example.com/models/model-123/occupationGroups/group-123",
        tabiyaPath: "https://api.example.com/models/model-123/occupationGroups/uuid-123",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
      })
    );
  });
});
