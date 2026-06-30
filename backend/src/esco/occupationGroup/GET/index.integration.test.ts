import "_test_utilities/consoleMock";
import { Connection } from "mongoose";
import addFormats from "ajv-formats";
import Ajv, { ValidateFunction } from "ajv";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { initOnce } from "server/init";
import { StatusCodes } from "server/httpUtils";
import { handler as occupationGroupHandler } from "./index";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import {
  createChildOccupationGroups,
  createModelInDB,
  createOccupationGroupInDB,
} from "esco/_test_utilities/createDocsInDB";

async function createOccupationGroupsInDB(count: number, modelId: string = getMockStringId(1)) {
  const occupationGroups = [];
  for (let i = 0; i < count; i++) {
    occupationGroups.push(await createOccupationGroupInDB(modelId));
  }
  return occupationGroups;
}

function buildRequestEvent(modelId: string, queryStringParameters: object) {
  return {
    httpMethod: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    pathParameters: { modelId: modelId.toString() },
    path: `/models/${modelId}/occupationGroups`,
    queryStringParameters,
  };
}

describe("Test for occupationGroup GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationGroupAPISpecs.GET.Schemas.Response.Payload);
  const validateGETResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupGetHandlerTestDB");
    const configModule = await import("server/config/config");
    jest.spyOn(configModule, "readEnvironmentConfiguration").mockReturnValue(config);
    await initOnce();
    dbConnection = getConnectionManager().getCurrentDBConnection();
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  beforeEach(async () => {
    if (dbConnection) {
      await dbConnection.models.OccupationGroupModel.deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });

  test("GET /occupationGroups should return a paginated list of occupation groups", async () => {
    // CONSTANT: N number of occupation Groups
    const N_OCCUPATION_GROUPS = 3;

    // CONSTANT the limit per page.
    const LIMIT = 3 - 1;

    // GUARD: The limit should be less than total number of the occupation groups
    expect(LIMIT).toBeLessThan(N_OCCUPATION_GROUPS);

    // GUARD: Page 2 content should be less than the limit, so that we have exactly 2 pages.
    expect(N_OCCUPATION_GROUPS / 2).toBeLessThan(LIMIT);

    // --------------

    // GIVEN a Taxonomy model is in the database
    const givenModelInfo = await createModelInDB();

    // AND N occupation groups are created in the database
    const givenOccupationGroups = await createOccupationGroupsInDB(N_OCCUPATION_GROUPS, givenModelInfo.id.toString());
    expect(givenOccupationGroups.length).toBe(N_OCCUPATION_GROUPS);

    // AND an API Gateway Event is constructed with limit and undefined cursor
    const givenPage1Event = buildRequestEvent(givenModelInfo.id, {
      limit: LIMIT.toString(),
      cursor: undefined,
    });

    // WHEN we query the first page
    const actualPage1Response = await occupationGroupHandler(givenPage1Event as never);

    // THEN the status code should be OK
    expect(actualPage1Response.statusCode).toEqual(StatusCodes.OK);

    const actualPage1ResponseJSON = JSON.parse(actualPage1Response.body);

    // AND the responseJSON should be truthy
    expect(validateGETResponse(actualPage1ResponseJSON)).toBeTruthy();

    // AND the limit should be the same as the limit we provided
    expect(actualPage1ResponseJSON.limit).toEqual(LIMIT);

    // AND the first page should return the first N occupation groups
    expect(actualPage1ResponseJSON.data).toHaveLength(LIMIT);

    // AND the next cursor should be truthy
    expect(actualPage1ResponseJSON.nextCursor).toBeTruthy();
    const actualNextCursor = actualPage1ResponseJSON.nextCursor;

    // GIVEN the second page event with the cursor from first page
    const givenPage2Event = buildRequestEvent(givenModelInfo.id, {
      limit: LIMIT.toString(),
      cursor: actualNextCursor,
    });

    // WHEN we query the second page
    const actualPage2Response = await occupationGroupHandler(givenPage2Event as never);

    // THEN the status code should be OK
    expect(actualPage2Response.statusCode).toEqual(StatusCodes.OK);

    const actualBody2 = JSON.parse(actualPage2Response.body);

    // AND the responseJSON should be truthy
    expect(validateGETResponse(actualBody2)).toBeTruthy();

    // AND the limit should be the same as the limit we provided
    expect(actualBody2.limit).toEqual(LIMIT);

    // AND the second page should return the last N occupation groups
    expect(actualBody2.data).toHaveLength(N_OCCUPATION_GROUPS - LIMIT);

    // AND the next cursor should be falsy
    expect(actualBody2.nextCursor).toBeFalsy();

    // AND no error should be logged
    expect(console.error).not.toHaveBeenCalled();

    // AND no warning should be logged
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("GET /occupationGroups should return on root occupation groups when provided a query param root=true", async () => {
    // GIVEN a model in the database
    const givenModelInfo = await createModelInDB();

    // AND one parent occupation group
    const givenParentOccupationGroup = await createOccupationGroupsInDB(1, givenModelInfo.id.toString());
    expect(givenParentOccupationGroup.length).toBe(1);

    // AND two child occupation groups
    const givenChildOccupationGroups = await createChildOccupationGroups(givenParentOccupationGroup[0].id, 2);
    expect(givenChildOccupationGroups).toHaveLength(2);

    // WHEN querying the handler with root=true
    let givenEvent = buildRequestEvent(givenModelInfo.id, {
      limit: "3",
      cursor: undefined,
      root: "true",
    });
    let response = await occupationGroupHandler(givenEvent as never);

    // THEN it should only return OK
    expect(response.statusCode).toEqual(StatusCodes.OK);

    // AND the response should contain the parent occupation group
    expect(response.body).toContain(givenParentOccupationGroup[0].id);

    // AND it should only be one item
    expect(JSON.parse(response.body).data).toHaveLength(givenParentOccupationGroup.length);

    // WHEN not filtering by on root occupations
    givenEvent = buildRequestEvent(givenModelInfo.id, {
      limit: "3",
      cursor: undefined,
      // root: "false",
    });
    response = await occupationGroupHandler(givenEvent as never);
    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(JSON.parse(response.body).data).toHaveLength(
      givenParentOccupationGroup.length + givenChildOccupationGroups.length
    );
  });
});
