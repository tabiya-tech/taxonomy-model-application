import { ObjectTypes } from "esco/common/objectTypes";
import { transformParent } from "./response";
import {
  getIOccupationGroupMockData,
  getIOccupationGroupMockDataWithOccupationChildren,
} from "../../../_shared/testDataHelper";
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
    expect(actual.children[0].objectType).toBe(
      OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation
    );
  });

  test("maps occupation group children with objectType correctly", () => {
    const givenObject = getIOccupationGroupMockData();
    givenObject.children = [
      {
        id: "child-1",
        UUID: "child-uuid-1",
        code: "CODE1",
        preferredLabel: "Child Label 1",
        objectType: ObjectTypes.ISCOGroup,
      },
    ];

    const actual = transformParent(givenObject, "https://api.example.com");

    expect(actual.children).toHaveLength(1);
    expect(actual.children[0]).toEqual({
      id: "child-1",
      UUID: "child-uuid-1",
      code: "CODE1",
      preferredLabel: "Child Label 1",
      objectType: OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup,
    });
  });

  test("maps LocalGroup parent and LocalGroup children with empty UUIDHistory", () => {
    const givenObject = getIOccupationGroupMockData();
    givenObject.parent = {
      id: "local-parent-id",
      UUID: "local-parent-uuid",
      code: "LPARENT",
      preferredLabel: "Local Parent",
      objectType: ObjectTypes.LocalGroup,
    };
    givenObject.children = [
      {
        id: "local-child-id",
        UUID: "local-child-uuid",
        code: "LCHILD",
        preferredLabel: "Local Child",
        objectType: ObjectTypes.LocalGroup,
      },
    ];
    givenObject.UUIDHistory = [];

    const actual = transformParent(givenObject, "https://api.example.com");

    expect(actual.parent?.objectType).toBe(OccupationGroupAPISpecs.Enums.Relations.Parent.ObjectTypes.LocalGroup);
    expect(actual.children[0].objectType).toBe(OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup);
    expect(actual.originUUID).toBe("");
  });

  test("maps occupation children with LocalOccupation type", () => {
    const givenObject = getIOccupationGroupMockData();
    givenObject.children = [
      {
        id: "occ-id",
        UUID: "occ-uuid",
        code: "OCC",
        preferredLabel: "Occupation Child",
        occupationType: ObjectTypes.LocalOccupation,
        occupationGroupCode: "GRP",
        isLocalized: true,
      },
    ];

    const actual = transformParent(givenObject, "https://api.example.com");

    expect(actual.children[0].objectType).toBe(
      OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation
    );
  });
});
