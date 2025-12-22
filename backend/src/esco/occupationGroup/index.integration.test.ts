import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as occupationGroupHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupationGroup } from "./OccupationGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";

async function createModelInDB() {
  return await getRepositoryRegistry().modelInfo.create({
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    UUIDHistory: [randomUUID()],
  });
}

async function createOccupationGroupInDB(modelId: string = getMockStringId(1)) {
  return await getRepositoryRegistry().OccupationGroup.create({
    modelId: modelId,
    code: getMockRandomISCOGroupCode(),
    groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
    preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getTestString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
  });
}
async function createOccupationGroupsInDB(count: number, modelId: string = getMockStringId(1)) {
  const occupationGroups: IOccupationGroup[] = [];
  for (let i = 0; i < count; i++) {
    occupationGroups.push(await createOccupationGroupInDB(modelId));
  }
  return occupationGroups;
}

describe("Test for occupationGroup handler with a DB", () => {
  // setup the ajv validate GET, POST, etc response functions
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv
    .addSchema(OccupationGroupAPISpecs.Schemas.GET.Response.Payload)
    .addSchema(OccupationGroupAPISpecs.Schemas.POST.Response.Payload);
  const validateGETResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.Schemas.GET.Response.Payload.$id as string
  ) as ValidateFunction;
  const validatePOSTResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.Schemas.POST.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationGroupHandlerTestDB");
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
      // delete all documents in the DB
      await dbConnection.models.OccupationGroupModel.deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });

  test("POST should respond with the FORBIDDEN status code if the user is not a model manager", async () => {
    // GIVEN a valid request (method & header & payload)
    const givenModelInfo = await createModelInDB();

    const givenPayload: OccupationGroupAPISpecs.Types.POST.Request.Payload = {
      modelId: givenModelInfo.id.toString(),
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      description: getTestString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      altLabels: [getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      requestContext: usersRequestContext.REGISTED_USER,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationGroupHandler(givenEvent);

    // THEN expect the handler to respond with the FORBIDDEN status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("POST should respond with the CREATED status code and response passes the JSON schema validation", async () => {
    // GIVEN a valid request (method & header & payload)
    const givenModelInfo = await createModelInDB();
    const givenPayload: OccupationGroupAPISpecs.Types.POST.Request.Payload = {
      modelId: givenModelInfo.id.toString(),
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      description: getTestString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      altLabels: [getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      pathParameters: { modelId: givenModelInfo.id.toString() },
      requestContext: usersRequestContext.MODEL_MANAGER,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationGroupHandler(givenEvent);
    // THEN expect the handler to respond with the CREATED status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    validatePOSTResponse(JSON.parse(actualResponse.body));
    // AND an OccupationGroup object that validates against the OccupationGroupRequest schema
    expect(validatePOSTResponse.errors).toBeNull();
  });

  test("POST should respond with BAD_REQUEST status code when body is null", async () => {
    // GIVEN a request with null body
    const givenModelInfo = await createModelInDB();
    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: null,
      headers: {
        "Content-Type": "application/json",
      },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      pathParameters: { modelId: givenModelInfo.id.toString() },
      requestContext: usersRequestContext.MODEL_MANAGER,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationGroupHandler(givenEvent);

    // THEN expect the handler to respond with the BAD_REQUEST status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("GET should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    // GIVEN several OccupationGroup objects are in the DB
    const givenModelInfo = await createModelInDB();

    const occupationGroups = await createOccupationGroupsInDB(3, givenModelInfo.id.toString());
    expect(occupationGroups.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    const limit = 2;
    const cursor = Buffer.from(
      JSON.stringify({ id: occupationGroups[2].id, createdAt: occupationGroups[2].createdAt })
    ).toString("base64");

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      queryStringParameters: {
        limit: limit.toString(),
        cursor: cursor,
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationGroupHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND an occupationGroup object that validates against the OccupationGroupResponseGET schema
    validateGETResponse(JSON.parse(actualResponse.body));
    expect(validateGETResponse.errors).toBeNull();
  });

  // security tests
  test("GET should return at most the passed limit occupationGroups", async () => {
    // GIVEN several OccupationGroup objects are in the DB
    const givenModelInfo = await createModelInDB();
    const occupationGroups = await createOccupationGroupsInDB(10, givenModelInfo.id.toString());
    expect(occupationGroups.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    const limit = 5;
    const cursor = Buffer.from(
      JSON.stringify({ id: occupationGroups[8].id, createdAt: occupationGroups[8].createdAt })
    ).toString("base64");

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: {
        limit: limit,
        cursor: cursor,
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationGroupHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    const actualBody = JSON.parse(actualResponse.body);
    const actualOccupationGroups = actualBody.data as IOccupationGroup[];

    // AND the response occupationGroups should have at most of the limit count of OccupationGroups
    expect(actualOccupationGroups.length).toBeLessThanOrEqual(limit);

    // AND the response occupationGroups should be the expected ones
    // The cursor points to occupationGroups[8], so with descending order we expect the 5 items older than that
    // which are occupationGroups[7, 6, 5, 4, 3] in descending order (newest to oldest of those)
    expect(actualOccupationGroups.map((m) => m.UUID)).toMatchObject(
      occupationGroups
        .slice(3, 8)
        .reverse()
        .map((m) => m.UUID)
    );
  });

  test("GET should paginate occupationGroups without skipping items when chaining nextCursor", async () => {
    // GIVEN five occupationGroups in the DB
    const givenModelInfo = await createModelInDB();
    await createOccupationGroupsInDB(5, givenModelInfo.id.toString());

    // Baseline: get first 3 to capture the server’s ordering
    const baselineEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      queryStringParameters: { limit: "3" },
    };
    // @ts-ignore
    const baselineResponse = await occupationGroupHandler(baselineEvent);
    expect(baselineResponse.statusCode).toEqual(StatusCodes.OK);
    const baselineBody = JSON.parse(baselineResponse.body);
    const baselineIds = (baselineBody.data as IOccupationGroup[]).map((m) => m.id.toString());
    expect(baselineIds).toHaveLength(3);

    // Page 1 (single): limit=1, no cursor
    const page1Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      queryStringParameters: { limit: "1" },
    };
    // @ts-ignore
    const page1Response = await occupationGroupHandler(page1Event);
    expect(page1Response.statusCode).toEqual(StatusCodes.OK);
    const page1Body = JSON.parse(page1Response.body);
    const page1Ids = (page1Body.data as IOccupationGroup[]).map((m) => m.id.toString());
    expect(page1Ids).toEqual(baselineIds.slice(0, 1));
    expect(page1Body.nextCursor).toBeDefined();

    // Page 2 (single): limit=1 with cursor from page1
    const page2Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      queryStringParameters: { limit: "1", cursor: page1Body.nextCursor },
    };
    // @ts-ignore
    const page2Response = await occupationGroupHandler(page2Event);
    expect(page2Response.statusCode).toEqual(StatusCodes.OK);
    const page2Body = JSON.parse(page2Response.body);
    const page2Ids = (page2Body.data as IOccupationGroup[]).map((m) => m.id.toString());
    expect(page2Ids).toEqual(baselineIds.slice(1, 2));
    expect(page2Body.nextCursor).toBeDefined();

    // Page 3 (single): limit=1 with cursor from page2
    const page3Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      queryStringParameters: { limit: "1", cursor: page2Body.nextCursor },
    };
    // @ts-ignore
    const page3Response = await occupationGroupHandler(page3Event);
    expect(page3Response.statusCode).toEqual(StatusCodes.OK);
    const page3Body = JSON.parse(page3Response.body);
    const page3Ids = (page3Body.data as IOccupationGroup[]).map((m) => m.id.toString());

    // THEN chained singles reconstruct baseline first 3
    const chained = [...page1Ids, ...page2Ids, ...page3Ids];
    expect(chained).toEqual(baselineIds);
  });

  test("GET should paginate occupationGroups correctly across mixed page sizes (2 then 2)", async () => {
    // GIVEN five occupationGroups in the DB
    const givenModelInfo = await createModelInDB();
    await createOccupationGroupsInDB(5, givenModelInfo.id.toString());

    // Baseline: get first 4 to capture ordering
    const baselineEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      queryStringParameters: { limit: "4" },
    };
    // @ts-ignore
    const baselineResponse = await occupationGroupHandler(baselineEvent);
    expect(baselineResponse.statusCode).toEqual(StatusCodes.OK);
    const baselineBody = JSON.parse(baselineResponse.body);
    const baselineIds = (baselineBody.data as IOccupationGroup[]).map((m) => m.id.toString());
    expect(baselineIds).toHaveLength(4);

    // Page 1: limit=2
    const page1Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      queryStringParameters: { limit: "2" },
    };
    // @ts-ignore
    const page1Response = await occupationGroupHandler(page1Event);
    expect(page1Response.statusCode).toEqual(StatusCodes.OK);
    const page1Body = JSON.parse(page1Response.body);
    const page1Ids = (page1Body.data as IOccupationGroup[]).map((m) => m.id.toString());
    expect(page1Ids).toEqual(baselineIds.slice(0, 2));
    expect(page1Body.nextCursor).toBeDefined();

    // Page 2: limit=2 with cursor from page1
    const page2Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      queryStringParameters: { limit: "2", cursor: page1Body.nextCursor },
    };
    // @ts-ignore
    const page2Response = await occupationGroupHandler(page2Event);
    expect(page2Response.statusCode).toEqual(StatusCodes.OK);
    const page2Body = JSON.parse(page2Response.body);
    const page2Ids = (page2Body.data as IOccupationGroup[]).map((m) => m.id.toString());

    // THEN combined equals baseline first 4
    const combined = [...page1Ids, ...page2Ids];
    expect(combined).toEqual(baselineIds);
  });

  test("GET should paginate occupationGroups correctly across random page sizes", async () => {
    // GIVEN twenty occupationGroups in the DB
    const givenModelInfo = await createModelInDB();
    await createOccupationGroupsInDB(20, givenModelInfo.id.toString());

    // Baseline: first 20 to know expected order
    const baselineEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      queryStringParameters: { limit: "20" },
    };
    // @ts-ignore
    const baselineResponse = await occupationGroupHandler(baselineEvent);
    expect(baselineResponse.statusCode).toEqual(StatusCodes.OK);
    const baselineBody = JSON.parse(baselineResponse.body);
    const baselineIds = (baselineBody.data as IOccupationGroup[]).map((m) => m.id.toString());
    expect(baselineIds).toHaveLength(20);

    // Generate random page sizes in [1,20] to test pagination with different limits
    const pageSizes: number[] = [];
    let planned = 0;
    while (planned < baselineIds.length) {
      const size = 1 + Math.floor(Math.random() * 20); // 1..20
      pageSizes.push(size);
      planned += size;
    }

    let cursor: string | undefined = undefined;
    const collected: string[] = [];

    for (const size of pageSizes) {
      const event = {
        httpMethod: HTTP_VERBS.GET,
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelInfo.id}/occupationGroups`,
        pathParameters: { modelId: givenModelInfo.id.toString() },
        queryStringParameters: { limit: size.toString(), ...(cursor ? { cursor } : {}) },
      };
      // @ts-ignore
      const resp = await occupationGroupHandler(event);
      expect(resp.statusCode).toEqual(StatusCodes.OK);
      const body = JSON.parse(resp.body);
      const ids = (body.data as IOccupationGroup[]).map((m) => m.id.toString());
      collected.push(...ids);
      cursor = body.nextCursor || undefined;
      if (!cursor) break;
    }

    expect(collected.slice(0, baselineIds.length)).toEqual(baselineIds);
  });
});
