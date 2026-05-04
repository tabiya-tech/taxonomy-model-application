import { ObjectTypes } from "esco/common/objectTypes";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { transformPaginatedChildren } from "./response";
import { getIOccupationGroupOccupationGroupTypedChildData } from "../../../testDataHelper";

describe("transformPaginatedChildren()", () => {
  test("maps paginated children into the children API response shape", () => {
    const givenChildren = [
      getIOccupationGroupOccupationGroupTypedChildData(1),
      getIOccupationGroupOccupationGroupTypedChildData(2),
    ];

    const actual = transformPaginatedChildren(givenChildren, "https://api.example.com", 2, "cursor-123");

    expect(actual).toEqual({
      data: givenChildren.map((child) =>
        expect.objectContaining({
          id: child.id,
          UUID: child.UUID,
          code: child.code,
          originUri: child.originUri,
          preferredLabel: child.preferredLabel,
          altLabels: child.altLabels,
          objectType:
            child.objectType === ObjectTypes.ISCOGroup
              ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup
              : OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup,
          description: child.description,
          modelId: child.modelId,
          path: `https://api.example.com/models/${child.modelId}/occupationGroups/${child.id}/children`,
          tabiyaPath: `https://api.example.com/models/${child.modelId}/occupationGroups/${child.UUID}/children`,
          parentId: child.parentId,
          UUIDHistory: child.UUIDHistory,
          createdAt: child.createdAt.toISOString(),
          updatedAt: child.updatedAt.toISOString(),
          originUUID: child.UUIDHistory.at(-1),
        })
      ),
      limit: 2,
      nextCursor: "cursor-123",
    });
  });
});
