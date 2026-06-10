import { IOccupationGroup, IOccupationGroupChild } from "./OccupationGroup.types";
import {
  getIOccupationGroupMockData,
  getIOccupationGroupMockDataWithOccupationChildren,
  getIOccupationGroupOccupationGroupTypedChildData,
  getNewOccupationGroupSpec,
} from "./testDataHelper";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { transform, transformChild } from "./transform";
import { Routes } from "routes.constant";
import { ObjectTypes } from "esco/common/objectTypes";

describe("getNewOccupationGroupSpec", () => {
  test("should return a valid occupation group spec object", () => {
    const result = getNewOccupationGroupSpec();

    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("preferredLabel");
    expect(result).toHaveProperty("groupType", OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup);
    expect(result.UUIDHistory).toBeInstanceOf(Array);
    expect(result.UUIDHistory.length).toBeGreaterThan(0);
  });
});
describe("test the transformation of the IOccupationGroup -> IOccupationGroupResponse", () => {
  test("should transform the IOccupationGroup to IOccupationGroupResponse", () => {
    // GIVEN a random IOccupationGroup
    const givenObject: IOccupationGroup = getIOccupationGroupMockData();
    // AND some base path
    const givenBasePath = "https://some/root/path";
    // AND some model

    // WHEN the transformation function is called
    const actual: OccupationGroupAPISpecs.POST.Types.Response.Payload = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a IOccupationGroupResponse
    // that contains the input from the IOccupationGroup
    expect(actual).toEqual(
      expect.objectContaining({
        // core fields
        id: givenObject.id,
        UUID: givenObject.UUID,
        UUIDHistory: givenObject.UUIDHistory,
        code: givenObject.code,
        originUri: givenObject.originUri,
        preferredLabel: givenObject.preferredLabel,
        altLabels: givenObject.altLabels,
        groupType: givenObject.groupType,
        description: givenObject.description,
        modelId: givenObject.modelId,
        // hierarchy and paths
        parent: null,
        children: [],
        path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/occupationGroups/${givenObject.id}`,
        tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/occupationGroups/${givenObject.UUID}`,
        // timestamps
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
      })
    );
  });
  test("should transform the IOccupationGroup to IOccupationGroupResponse With Occupation Children", () => {
    // GIVEN a random IOccupationGroup
    const givenObject: IOccupationGroup = getIOccupationGroupMockDataWithOccupationChildren();
    // AND some base path
    const givenBasePath = "https://some/root/path";
    // AND some model

    // WHEN the transformation function is called
    const actual: OccupationGroupAPISpecs.POST.Types.Response.Payload = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a IOccupationGroupResponse
    // that contains the input from the IOccupationGroup
    expect(actual).toEqual(
      expect.objectContaining({
        id: givenObject.id,
        UUID: givenObject.UUID,
        UUIDHistory: givenObject.UUIDHistory,
        code: givenObject.code,
        originUri: givenObject.originUri,
        preferredLabel: givenObject.preferredLabel,
        altLabels: givenObject.altLabels,
        groupType: givenObject.groupType,
        description: givenObject.description,
        modelId: givenObject.modelId,
        parent: null,
        children: givenObject.children.map((child) => {
          return {
            id: child.id,
            UUID: child.UUID,
            code: child.code,
            preferredLabel: child.preferredLabel,
            objectType:
              "objectType" in child && child.objectType === ObjectTypes.ISCOGroup
                ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup
                : "objectType" in child && child.objectType === ObjectTypes.LocalGroup
                ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup
                : "occupationType" in child && child.occupationType === ObjectTypes.ESCOOccupation
                ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation
                : OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation,
          };
        }),
        path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/occupationGroups/${givenObject.id}`,
        tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/occupationGroups/${givenObject.UUID}`,
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
      })
    );
  });
  test("should transform the IOccupationGroup to IOccupationGroupResponse With Group Children", () => {
    const givenObject: IOccupationGroup = getIOccupationGroupMockData();
    givenObject.children = [
      {
        id: "group-child-id",
        UUID: "group-child-uuid",
        code: "GCHILD",
        preferredLabel: "Group Child",
        objectType: ObjectTypes.ISCOGroup,
      },
    ];
    const givenBasePath = "https://some/root/path";
    const actual = transform(givenObject, givenBasePath);
    expect(actual.children).toHaveLength(1);
    expect(actual.children[0]).toEqual({
      id: "group-child-id",
      UUID: "group-child-uuid",
      code: "GCHILD",
      preferredLabel: "Group Child",
      objectType: OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup,
    });
  });
  test("should transform with LocalGroup type, parent, LocalGroup children, and empty UUIDHistory", () => {
    const givenObject: IOccupationGroup = getIOccupationGroupMockData();
    givenObject.groupType = ObjectTypes.LocalGroup;
    givenObject.parent = {
      id: "parent-id",
      UUID: "parent-uuid",
      code: "PARENT",
      preferredLabel: "Parent Label",
      objectType: ObjectTypes.LocalGroup,
    };
    givenObject.children = [
      {
        id: "lg-child-id",
        UUID: "lg-child-uuid",
        code: "LGCHILD",
        preferredLabel: "Local Group Child",
        objectType: ObjectTypes.LocalGroup,
      },
    ];
    givenObject.UUIDHistory = [];
    const givenBasePath = "https://some/root/path";
    const actual = transform(givenObject, givenBasePath);
    expect(actual.groupType).toBe(OccupationGroupAPISpecs.Enums.ObjectTypes.LocalGroup);
    expect(actual.parent).toEqual({
      id: "parent-id",
      UUID: "parent-uuid",
      code: "PARENT",
      preferredLabel: "Parent Label",
      objectType: OccupationGroupAPISpecs.Enums.Relations.Parent.ObjectTypes.LocalGroup,
    });
    expect(actual.children[0].objectType).toBe(OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup);
    expect(actual.originUUID).toBe("");
  });

  test("should transform with ISCOGroup parent type", () => {
    const givenObject: IOccupationGroup = getIOccupationGroupMockData();
    givenObject.parent = {
      id: "parent-id",
      UUID: "parent-uuid",
      code: "PARENT",
      preferredLabel: "Parent Label",
      objectType: ObjectTypes.ISCOGroup,
    };
    const givenBasePath = "https://some/root/path";
    const actual = transform(givenObject, givenBasePath);
    expect(actual.parent).toEqual({
      id: "parent-id",
      UUID: "parent-uuid",
      code: "PARENT",
      preferredLabel: "Parent Label",
      objectType: OccupationGroupAPISpecs.Enums.Relations.Parent.ObjectTypes.ISCOGroup,
    });
  });
  test("should transform with occupation children having LocalOccupation type", () => {
    const givenObject: IOccupationGroup = getIOccupationGroupMockData();
    givenObject.children = [
      {
        id: "occ-child-id",
        UUID: "occ-child-uuid",
        code: "OCC",
        preferredLabel: "Occupation Child",
        occupationType: ObjectTypes.LocalOccupation,
        occupationGroupCode: "GRP",
        isLocalized: true,
      },
    ];
    const givenBasePath = "https://some/root/path";
    const actual = transform(givenObject, givenBasePath);
    expect(actual.children[0].objectType).toBe(
      OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation
    );
  });
});

describe("test the transformChild of the IOccupationGroupChild -> IOccupationGroupChildResponse", () => {
  test("should transform the IOccupationGroupChild to IOccupationGroupChildResponse", () => {
    // GIVEN a random IOccupationGroupChild
    const givenChild: IOccupationGroupChild = getIOccupationGroupOccupationGroupTypedChildData();

    // AND some base path
    const givenBasePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual: OccupationGroupAPISpecs.OccupationGroup.Children.GET.Types.Response.Child.Payload = transformChild(
      givenChild,
      givenBasePath
    );

    // THEN expect the transformation function to return a IOccupationGroupChildResponse
    expect(actual).toEqual(
      expect.objectContaining({
        // core fields
        id: givenChild.id,
        UUID: givenChild.UUID,
        code: givenChild.code,
        originUri: givenChild.originUri,
        preferredLabel: givenChild.preferredLabel,
        altLabels: givenChild.altLabels,
        objectType:
          givenChild.objectType === ObjectTypes.ISCOGroup
            ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup
            : OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup,
        description: givenChild.description,
        modelId: givenChild.modelId,
        // paths
        path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenChild.modelId}/occupationGroups/${givenChild.id}/children`,
        tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenChild.modelId}/occupationGroups/${givenChild.UUID}/children`,
        parentId: givenChild.parentId,
        UUIDHistory: givenChild.UUIDHistory,
        // timestamps
        createdAt: givenChild.createdAt.toISOString(),
        updatedAt: givenChild.updatedAt.toISOString(),
        originUUID: givenChild.UUIDHistory && givenChild.UUIDHistory.length > 0 ? givenChild.UUIDHistory.at(-1)! : "",
      })
    );
  });

  test("should transform a LocalGroup child", () => {
    const givenChild: IOccupationGroupChild = getIOccupationGroupOccupationGroupTypedChildData();
    givenChild.objectType = ObjectTypes.LocalGroup;
    const givenBasePath = "https://some/root/path";
    const actual = transformChild(givenChild, givenBasePath);
    expect(actual.objectType).toBe(OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup);
  });

  test("should transform an ESCOOccupation child", () => {
    const givenChild: IOccupationGroupChild = getIOccupationGroupOccupationGroupTypedChildData();
    givenChild.objectType = ObjectTypes.ESCOOccupation;
    const givenBasePath = "https://some/root/path";
    const actual = transformChild(givenChild, givenBasePath);
    expect(actual.objectType).toBe(OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation);
  });

  test("should transform a LocalOccupation child", () => {
    const givenChild: IOccupationGroupChild = getIOccupationGroupOccupationGroupTypedChildData();
    givenChild.objectType = ObjectTypes.LocalOccupation;
    const givenBasePath = "https://some/root/path";
    const actual = transformChild(givenChild, givenBasePath);
    expect(actual.objectType).toBe(OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation);
  });
});
