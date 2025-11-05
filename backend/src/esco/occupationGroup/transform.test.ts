import { randomUUID } from "crypto";
import { IOccupationGroup } from "./OccupationGroup.types";
import {
  getIOccupationGroupMockData,
  getIOccupationGroupMockDataWithOccupationChildren,
  getIOccupationGroupMockDataWithOccupationGroupChildren,
  getNewOccupationGroupSpec,
} from "./testDataHelper";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { transform, transformPaginated } from "./transform";
import { Routes } from "routes.constant";
import { ObjectTypes } from "esco/common/objectTypes";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { IOccupationReference } from "esco/occupations/occupationReference.types";

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
    const actual: OccupationGroupAPISpecs.Types.POST.Response.Payload = transform(givenObject, givenBasePath);

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
    const actual: OccupationGroupAPISpecs.Types.POST.Response.Payload = transform(givenObject, givenBasePath);

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

describe("test the transformation of the IOccupationGroup[] -> IOccupationGroupResponse[]", () => {
  test("should transform the IOccupationGroup[] to IOccupationGroupResponse[]", () => {
    // GIVEN an array of random IOccupationGroup
    const givenObjects: IOccupationGroup[] = [
      getIOccupationGroupMockData(),
      getIOccupationGroupMockDataWithOccupationGroupChildren(),
      getIOccupationGroupMockDataWithOccupationChildren(),
    ];

    // AND some base path
    const givenBasePath = "https://some/root/path";
    // AND some limit and cursor
    const limit = 2;
    const cursor = Buffer.from(`${givenObjects[limit].id}|${givenObjects[limit].createdAt.toISOString()}`).toString(
      "base64"
    );

    // WHEN the transformation function is called
    // with a limit that is less than the number of given objects
    // to test that pagination works as expected
    const givenObjectsPaginated = givenObjects.slice(0, limit);

    // THEN expect the transformation function to return a IOccupationGroupResponse[]
    const actual: OccupationGroupAPISpecs.Types.GET.Response.Payload = transformPaginated(
      givenObjectsPaginated,
      givenBasePath,
      limit,
      cursor
    );
    expect(actual).toEqual({
      data: givenObjectsPaginated.map((obj) =>
        expect.objectContaining({
          id: obj.id,
          UUID: obj.UUID,
          UUIDHistory: obj.UUIDHistory,
          code: obj.code,
          originUri: obj.originUri,
          preferredLabel: obj.preferredLabel,
          altLabels: obj.altLabels,
          groupType: obj.groupType,
          description: obj.description,
          modelId: obj.modelId,
          parent: null,
          children: expect.any(Array),
          path: `${givenBasePath}${Routes.MODELS_ROUTE}/${obj.modelId}/occupationGroups/${obj.id}`,
          tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${obj.modelId}/occupationGroups/${obj.UUID}`,
          createdAt: obj.createdAt.toISOString(),
          updatedAt: obj.updatedAt.toISOString(),
        })
      ),
      nextCursor: cursor,
      limit: limit,
    });
  });
});

describe("test the transformation groupType field of IOccupationGroup[] -> IOccupationGroupResponse[] objectType", () => {
  test("should handle groupType = ISCOGroup", () => {
    const givenObject = getIOccupationGroupMockData();
    givenObject.groupType = ObjectTypes.ISCOGroup;

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.groupType).toBe(OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup);
  });
  test("should handle groupType = LocalGroup", () => {
    const givenObject = getIOccupationGroupMockData();
    givenObject.groupType = ObjectTypes.LocalGroup;

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.groupType).toBe(OccupationGroupAPISpecs.Enums.ObjectTypes.LocalGroup);
  });
  test("should transform parent when parent exists with ISCOGroup type", () => {
    const givenObject = getIOccupationGroupMockData();
    givenObject.parent = {
      id: getMockStringId(2),
      UUID: randomUUID(),
      code: getRandomString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
      preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      objectType: ObjectTypes.ISCOGroup,
    };

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.parent).toEqual({
      id: givenObject.parent.id,
      UUID: givenObject.parent.UUID,
      code: givenObject.parent.code,
      preferredLabel: givenObject.parent.preferredLabel,
      objectType: OccupationGroupAPISpecs.Enums.Relations.Parent.ObjectTypes.ISCOGroup,
    });
  });
  test("should transform parent when parent exists with LocalGroup type", () => {
    const givenObject = getIOccupationGroupMockData();
    givenObject.parent = {
      id: getMockStringId(2),
      UUID: randomUUID(),
      code: getRandomString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
      preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      objectType: ObjectTypes.LocalGroup, // 👈 opposite case
    };

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.parent).toEqual({
      id: givenObject.parent.id,
      UUID: givenObject.parent.UUID,
      code: givenObject.parent.code,
      preferredLabel: givenObject.parent.preferredLabel,
      objectType: OccupationGroupAPISpecs.Enums.Relations.Parent.ObjectTypes.LocalGroup, // 👈 expected other enum
    });
  });
  test("should transform children with objectType = ISCOGroup", () => {
    const givenObject = getIOccupationGroupMockData();
    givenObject.children = [
      {
        id: "child-id",
        UUID: "child-uuid",
        code: "CHILD01",
        preferredLabel: "Child ISCO",
        objectType: ObjectTypes.ISCOGroup,
      },
    ];

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.children[0].objectType).toBe(OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup);
  });
  test("should transform children with objectType = LocalGroup", () => {
    const givenObject = getIOccupationGroupMockData();
    givenObject.children = [
      {
        id: "child-id",
        UUID: "child-uuid",
        code: "CHILD02",
        preferredLabel: "Child Local",
        objectType: ObjectTypes.LocalGroup,
      },
    ];

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.children[0].objectType).toBe(OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup);
  });
  test("should transform children with occupationType = ESCOOccupation", () => {
    const givenObject = getIOccupationGroupMockDataWithOccupationChildren();

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.children[0].objectType).toBe(
      OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation
    );
  });
  test("should transform children with occupationType = LocalOccupation", () => {
    const child: IOccupationReference = {
      UUID: randomUUID(),
      code: getRandomString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
      id: getMockStringId(4),
      preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      occupationType: OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation,
      occupationGroupCode: getRandomString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
      isLocalized: false,
    };
    const givenObject: IOccupationGroup = {
      id: getMockStringId(1),
      UUID: randomUUID(),
      UUIDHistory: [randomUUID()],
      code: getRandomString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
      originUri: "https://foo.bar/" + 1,
      preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      altLabels: [getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      description: getRandomString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      parent: null,
      importId: getMockStringId(2),
      children: [child],
      modelId: getMockStringId(3),
      createdAt: new Date(1973, 11, 17, 0, 0, 0),
      updatedAt: new Date(),
    };

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.children[0].objectType).toBe(
      OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation
    );
  });
});

describe("test the transformation of originUUID field", () => {
  test("should set originUUID to the last UUID in UUIDHistory when UUIDHistory has items", () => {
    // GIVEN an occupation group with UUIDHistory containing multiple UUIDs
    const givenObject = getIOccupationGroupMockData();
    const firstUUID = randomUUID();
    const secondUUID = randomUUID();
    const thirdUUID = randomUUID();
    givenObject.UUIDHistory = [firstUUID, secondUUID, thirdUUID];

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect originUUID to be the last UUID in the history
    expect(actual.originUUID).toBe(thirdUUID);
  });

  test("should set originUUID to empty string when UUIDHistory is empty", () => {
    // GIVEN an occupation group with empty UUIDHistory
    const givenObject = getIOccupationGroupMockData();
    givenObject.UUIDHistory = [];

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect originUUID to be empty string
    expect(actual.originUUID).toBe("");
  });

  test("should set originUUID to empty string when UUIDHistory is null", () => {
    // GIVEN an occupation group with null UUIDHistory
    const givenObject = getIOccupationGroupMockData();
    // @ts-ignore
    givenObject.UUIDHistory = null;

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect originUUID to be empty string
    expect(actual.originUUID).toBe("");
  });

  test("should set originUUID to empty string when UUIDHistory is undefined", () => {
    // GIVEN an occupation group with undefined UUIDHistory
    const givenObject = getIOccupationGroupMockData();
    // @ts-ignore
    givenObject.UUIDHistory = undefined;

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect originUUID to be empty string
    expect(actual.originUUID).toBe("");
  });

  test("should set originUUID to the single UUID when UUIDHistory has only one item", () => {
    // GIVEN an occupation group with UUIDHistory containing only one UUID
    const givenObject = getIOccupationGroupMockData();
    const singleUUID = randomUUID();
    givenObject.UUIDHistory = [singleUUID];

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect originUUID to be that single UUID
    expect(actual.originUUID).toBe(singleUUID);
  });
});
