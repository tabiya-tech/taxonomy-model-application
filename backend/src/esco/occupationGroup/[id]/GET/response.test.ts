import { IOccupationGroup } from "../../_shared/OccupationGroup.types";
import {
  getIOccupationGroupMockData,
  getIOccupationGroupMockDataWithOccupationChildren,
} from "../../_shared/testDataHelper";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { transform } from "./response";
import { Routes } from "routes.constant";
import { ObjectTypes } from "esco/common/objectTypes";

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
});
