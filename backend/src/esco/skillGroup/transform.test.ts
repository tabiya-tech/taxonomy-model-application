import { ISkillGroup, ISkillGroupReference } from "./skillGroup.types";
import {
  getISkillGroupMockData,
  getISkillGroupMockDataWithSkillGroupChildren,
  getISkillGroupMockDataWithSkillChildren,
  getNewSkillGroupSpec,
  getISkillGroupMockDataWithSkillGroupParents,
} from "./testDataHelper";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { transform, transformPaginated } from "./transform";
import { Routes } from "routes.constant";
import { ISkillReference } from "esco/skill/skills.types";

describe("getNewSkillGroupSpec", () => {
  test("should return a valid skill group spec object", () => {
    const result = getNewSkillGroupSpec();
    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("preferredLabel");
    expect(result).toHaveProperty("altLabels");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("scopeNote");
    expect(result).toHaveProperty("modelId");
  });
});

describe("test the transformation of ISkillGroup -> ISkillGroupResponse", () => {
  test("should transform the ISkillGroup to ISkillGroupResponse", () => {
    // GIVEN a random ISkillGroup
    const givenObject: ISkillGroup = getISkillGroupMockData();
    // AND some base path
    const givenBasePath = "https://some/path";
    // WHEN the transformation function is called
    const actual: SkillGroupAPISpecs.Types.GET.Response.ById.Payload = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a ISkillGroupResponse
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
        description: givenObject.description,
        scopeNote: givenObject.scopeNote,
        // relations
        parents: [],
        children: [],
        // other fields
        originUUID: givenObject.UUIDHistory.at(-1)!,
        path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/skillGroups/${givenObject.id}`,
        tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/skillGroups/${givenObject.UUID}`,
        modelId: givenObject.modelId,
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
      })
    );
  });
  test("should transform the ISkillGroup to ISkillGroupResponse with Skill children", () => {
    // GIVEN a random ISkillGroup with Skill children
    const givenObject: ISkillGroup = getISkillGroupMockDataWithSkillChildren();
    // AND some base path
    const givenBasePath = "https://some/path";
    // WHEN the transformation function is called
    const actual: SkillGroupAPISpecs.Types.GET.Response.ById.Payload = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a ISkillGroupResponse
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
        description: givenObject.description,
        scopeNote: givenObject.scopeNote,
        // relations
        parents: [],
        children: givenObject.children.map((child) => {
          return {
            id: child.id,
            UUID: child.UUID,
            preferredLabel: child.preferredLabel,
            objectType: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.Skill,
            isLocalized: (child as ISkillReference).isLocalized,
          };
        }),
        // other fields
        originUUID: givenObject.UUIDHistory.at(-1)!,
        path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/skillGroups/${givenObject.id}`,
        tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/skillGroups/${givenObject.UUID}`,
        modelId: givenObject.modelId,
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
      })
    );
  });
  test("should transform the ISkillGroup to ISkillGroupResponse with SkillGroup parents", () => {
    // GIVEN a random ISkillGroup with SkillGroup parents
    const givenObject: ISkillGroup = getISkillGroupMockDataWithSkillGroupParents();
    // AND some base path
    const givenBasePath = "https://some/path";
    // WHEN the transformation function is called
    const actual: SkillGroupAPISpecs.Types.GET.Response.ById.Payload = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a ISkillGroupResponse
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
        description: givenObject.description,
        scopeNote: givenObject.scopeNote,
        // relations
        parents: givenObject.parents!.map((parent) => ({
          id: parent.id,
          UUID: parent.UUID,
          code: parent.code,
          preferredLabel: parent.preferredLabel,
          objectType: SkillGroupAPISpecs.Enums.Relations.Parents.ObjectTypes.SkillGroup,
        })),
        children: [],
        // other fields
        originUUID: givenObject.UUIDHistory.at(-1)!,
        path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/skillGroups/${givenObject.id}`,
        tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/skillGroups/${givenObject.UUID}`,
        modelId: givenObject.modelId,
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
      })
    );
  });
  test("should transform the ISkillGroup to ISkillGroupResponse with SkillGroup children", () => {
    // GIVEN a random ISkillGroup with SkillGroup children
    const givenObject: ISkillGroup = getISkillGroupMockDataWithSkillGroupChildren();
    // AND some base path
    const givenBasePath = "https://some/path";
    // WHEN the transformation function is called
    const actual: SkillGroupAPISpecs.Types.GET.Response.ById.Payload = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a ISkillGroupResponse
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
        description: givenObject.description,
        scopeNote: givenObject.scopeNote,
        // relations
        parents: [],
        children: givenObject.children.map((child) => {
          return {
            id: child.id,
            UUID: child.UUID,
            code: (child as ISkillGroupReference).code,
            preferredLabel: child.preferredLabel,
            objectType: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.SkillGroup,
          };
        }),
        // other fields
        originUUID: givenObject.UUIDHistory.at(-1)!,
        path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/skillGroups/${givenObject.id}`,
        tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/skillGroups/${givenObject.UUID}`,
        modelId: givenObject.modelId,
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
      })
    );
  });
  test("should transform the ISkillGroup to ISkillGroupResponse with empty UUIDHistory", () => {
    // GIVEN a random ISkillGroup with empty UUIDHistory
    const givenObject: ISkillGroup = {
      ...getISkillGroupMockData(),
      UUIDHistory: [],
    };
    // AND some base path
    const givenBasePath = "https://some/path";
    // WHEN the transformation function is called
    const actual: SkillGroupAPISpecs.Types.GET.Response.ById.Payload = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a ISkillGroupResponse
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
        description: givenObject.description,
        scopeNote: givenObject.scopeNote,
        // relations
        parents: [],
        children: [],
        // other fields
        originUUID: "",
        path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/skillGroups/${givenObject.id}`,
        tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/skillGroups/${givenObject.UUID}`,
        modelId: givenObject.modelId,
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
      })
    );
  });
});

describe("test the transformation of ISkillGroup[] -> ISkillGroupResponse[]", () => {
  test("should transform the ISkillGroup[] to ISkillGroupResponse[]", () => {
    // GIVEN a random ISkillGroup[]
    const givenSkillGroups: ISkillGroup[] = [
      getISkillGroupMockData(),
      getISkillGroupMockDataWithSkillGroupChildren(),
      getISkillGroupMockDataWithSkillChildren(),
      getISkillGroupMockDataWithSkillGroupParents(),
    ];

    // AND some base path
    const givenBasePath = "https://some/path";
    // AND some limit and cursor
    const limit = 2;
    const cursor = Buffer.from(
      `${givenSkillGroups[limit].id}|${givenSkillGroups[limit].createdAt.toISOString()}`
    ).toString("base64");

    // WHEN the transformation function is called
    const givenObjectsPaginated = givenSkillGroups.slice(0, limit);
    // THEN expect the transformation function to return a ISkillGroupResponse[]
    const actual: SkillGroupAPISpecs.Types.GET.Response.Payload = transformPaginated(
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
          description: obj.description,
          scopeNote: obj.scopeNote,
          parents: obj.parents,
          children: obj.children,
          originUUID: obj.UUIDHistory && obj.UUIDHistory.length > 0 ? obj.UUIDHistory.at(-1)! : "",
          path: `${givenBasePath}${Routes.MODELS_ROUTE}/${obj.modelId}/skillGroups/${obj.id}`,
          tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${obj.modelId}/skillGroups/${obj.UUID}`,
          modelId: obj.modelId,
          createdAt: obj.createdAt.toISOString(),
          updatedAt: obj.updatedAt.toISOString(),
        })
      ),
      nextCursor: cursor,
      limit: limit,
    });
  });
});
