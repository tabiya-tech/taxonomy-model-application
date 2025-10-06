import { IOccupationGroup } from "./OccupationGroup.types";
import { getIOccupationGroupMockData } from "./testDataHelper";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { transform, transformPaginated } from "./transform";
import { Routes } from "routes.constant";

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
    expect(actual).toEqual({
      ...givenObject,
      // AND no parent or children
      parent: null,
      importId: undefined,
      children: [],
      // AND the path and tabiya path as based on the given base path
      path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/occupationGroups/${givenObject.id}`,
      tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/occupationGroups/${givenObject.UUID}`,
      // AND the createdAt and updatedAt as string representation of date
      createdAt: givenObject.createdAt.toISOString(),
      updatedAt: givenObject.updatedAt.toISOString(),
    });
  });
});

describe("test the transformation of the IOccupationGroup[] -> IOccupationGroupResponse[]", () => {
  test("should transform the IOccupationGroup[] to IOccupationGroupResponse[]", () => {
    // GIVEN an array of random IOccupationGroup
    const givenObjects: IOccupationGroup[] = [
      getIOccupationGroupMockData(),
      getIOccupationGroupMockData(),
      getIOccupationGroupMockData(),
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
      data: givenObjectsPaginated.map((obj) => {
        return {
          ...obj,
          // AND no parent or children
          parent: null,
          importId: undefined,
          children: [],
          // AND the path and tabiya path as based on the given base path
          path: `${givenBasePath}${Routes.MODELS_ROUTE}/${obj.modelId}/occupationGroups/${obj.id}`,
          tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${obj.modelId}/occupationGroups/${obj.UUID}`,
          // AND the createdAt and updatedAt as string representation of date
          createdAt: obj.createdAt.toISOString(),
          updatedAt: obj.updatedAt.toISOString(),
        };
      }),
      nextCursor: cursor,
      limit: limit,
    });
  });
});
