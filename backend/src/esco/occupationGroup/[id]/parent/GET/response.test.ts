import { ObjectTypes } from "esco/common/objectTypes";
import { transformParent } from "./response";
import { getIOccupationGroupMockData, getIOccupationGroupMockDataWithOccupationChildren } from "../../../testDataHelper";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

describe("transformParent()", () => {
  test("maps a parent occupation group into the parent API response shape", () => {
    const givenObject = getIOccupationGroupMockData();
    const actual = transformParent(givenObject, "https://api.example.com");

    expect(actual).toEqual(
      expect.objectContaining({
        id: givenObject.id,
        UUID: givenObject.UUID,
        UUIDHistory: givenObject.UUIDHistory,
        code: givenObject.code,
        originUri: givenObject.originUri,
        preferredLabel: givenObject.preferredLabel,
        altLabels: givenObject.altLabels,
        description: givenObject.description,
        modelId: givenObject.modelId,
        path: `https://api.example.com/models/${givenObject.modelId}/occupationGroups/${givenObject.id}`,
        tabiyaPath: `https://api.example.com/models/${givenObject.modelId}/occupationGroups/${givenObject.UUID}`,
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
        originUUID: givenObject.UUIDHistory.at(-1),
      })
    );
  });

  test("maps nested parent and child object types", () => {
    const givenObject = getIOccupationGroupMockDataWithOccupationChildren();
    givenObject.groupType = ObjectTypes.LocalGroup;
    givenObject.parent = {
      id: "parent-id",
      UUID: "parent-uuid",
      code: "PARENT",
      preferredLabel: "Parent",
      objectType: ObjectTypes.ISCOGroup,
    };

    const actual = transformParent(givenObject, "https://api.example.com");

    expect(actual.groupType).toBe(OccupationGroupAPISpecs.Enums.ObjectTypes.LocalGroup);
    expect(actual.parent).toEqual({
      id: "parent-id",
      UUID: "parent-uuid",
      code: "PARENT",
      preferredLabel: "Parent",
      objectType: OccupationGroupAPISpecs.Enums.Relations.Parent.ObjectTypes.ISCOGroup,
    });
    expect(actual.children[0].objectType).toBe(OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation);
  });
});
