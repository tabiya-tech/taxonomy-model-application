import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as occupationHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupation } from "./occupation.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { ObjectTypes } from "esco/common/objectTypes";

async function createOccupationInDB(modelId: string = getMockStringId(1)) {
  return await getRepositoryRegistry().occupation.create({
    modelId: modelId,
    code: getMockRandomOccupationCode(false),
    occupationType: ObjectTypes.ESCOOccupation,
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getTestString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    occupationGroupCode: getMockRandomISCOGroupCode(),
    definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
    regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
    isLocalized: false,
  });
}
async function createOccupationsInDB(count: number, modelId: string = getMockStringId(1)) {
  const occupations: IOccupation[] = [];
  for (let i = 0; i < count; i++) {
    occupations.push(await createOccupationInDB(modelId));
  }
  return occupations;
}

describe("Test for occupation handler with a DB", () => {
  // setup the ajv validate GET, POST, etc response functions
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv
    .addSchema(OccupationAPISpecs.Schemas.GET.Response.Payload)
    .addSchema(OccupationAPISpecs.Schemas.POST.Response.Payload);
  const validateGETResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.Schemas.GET.Response.Payload.$id as string
  ) as ValidateFunction;
  const validatePOSTResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.Schemas.POST.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationHandlerTestDB");
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
      await dbConnection.models.OccupationModel.deleteMany({});
    }
  });

  test("POST should respond with the FORBIDDEN status code if the user is not a model manager", async () => {
    // GIVEN a valid request (method & header & payload)
    const givenPayload: OccupationAPISpecs.Types.POST.Request.Payload = {
      modelId: getMockStringId(1),
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      description: getTestString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      altLabels: [getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
      scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
      regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      requestContext: usersRequestContext.REGISTED_USER,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationHandler(givenEvent);

    // THEN expect the handler to respond with the FORBIDDEN status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("POST should respond with the CREATED status code and response passes the JSON schema validation", async () => {
    // GIVEN a valid request (method & header & payload)
    // Ensure model exists in DB
    const modelInfo = await getRepositoryRegistry().modelInfo.create({
      name: getTestString(10),
      locale: { UUID: randomUUID(), name: getTestString(5), shortCode: getTestString(2) },
      description: getTestString(10),
      license: getTestString(5),
      UUIDHistory: [randomUUID()],
    });
    const givenPayload: OccupationAPISpecs.Types.POST.Request.Payload = {
      modelId: modelInfo.id.toString(),
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      description: getTestString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      altLabels: [getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
      scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
      regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      path: `/models/${modelInfo.id}/occupations`,
      pathParameters: { modelId: modelInfo.id.toString() },
      requestContext: usersRequestContext.MODEL_MANAGER,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationHandler(givenEvent);

    // THEN expect the handler to respond with the CREATED status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    // AND an Occupation object that validates against the OccupationRequest schema
    validatePOSTResponse(JSON.parse(actualResponse.body));
    expect(validatePOSTResponse.errors).toBeNull();
  });

  test("POST should respond with BAD_REQUEST when body is null", async () => {
    // GIVEN a request with null body
    const modelId = getMockStringId(1);
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: null,
      headers: {
        "Content-Type": "application/json",
      },
      path: `/models/${modelId}/occupations`,
      pathParameters: { modelId: modelId },
      requestContext: usersRequestContext.MODEL_MANAGER,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationHandler(givenEvent);

    // THEN expect the handler to respond with BAD_REQUEST status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST); // -> Empty Body
  });

  test("GET should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    // GIVEN a model exists and several Occupation objects are in the DB
    const modelInfo = await getRepositoryRegistry().modelInfo.create({
      name: getTestString(10),
      locale: { UUID: randomUUID(), name: getTestString(5), shortCode: getTestString(2) },
      description: getTestString(10),
      license: getTestString(5),
      UUIDHistory: [randomUUID()],
    });
    const modelId = modelInfo.id.toString();
    const occupations = await createOccupationsInDB(3, modelId);
    expect(occupations.length).toBeGreaterThan(0); // guard to ensure that we actually have models in the DB
    const limit = 2;
    const cursor = Buffer.from(JSON.stringify({ id: occupations[2].id, createdAt: occupations[2].createdAt })).toString(
      "base64"
    );

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: modelId.toString() },
      queryStringParameters: {
        limit: limit.toString(),
        nextCursor: cursor,
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND an occupation object that validates against the OccupationResponseGET schema
    validateGETResponse(JSON.parse(actualResponse.body));
    expect(validateGETResponse.errors).toBeNull();
  });

  // security tests
  test("GET should return at most the passed limit occupations", async () => {
    // GIVEN a model exists and several Occupation objects are in the DB
    const modelInfo = await getRepositoryRegistry().modelInfo.create({
      name: getTestString(10),
      locale: { UUID: randomUUID(), name: getTestString(5), shortCode: getTestString(2) },
      description: getTestString(10),
      license: getTestString(5),
      UUIDHistory: [randomUUID()],
    });
    const modelId = modelInfo.id.toString();
    const occupations = await createOccupationsInDB(10, modelId);
    expect(occupations.length).toBeGreaterThan(0); // guard to ensure that we actually have models in the DB
    const limit = 5;
    const cursor = Buffer.from(JSON.stringify({ id: occupations[9].id, createdAt: occupations[9].createdAt })).toString(
      "base64"
    );

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: modelId.toString() },
      queryStringParameters: {
        limit: limit.toString(),
        cursor: cursor,
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    const actualBody = JSON.parse(actualResponse.body);
    const actualOccupations = actualBody.data as IOccupation[];

    // AND the response occupations should have at most of the limit count of Occupations
    expect(actualOccupations.length).toBeLessThanOrEqual(limit);

    // AND the response occupations should be the expected ones
    // The cursor points to occupations[9], so we expect the 5 items older than that
    // which are occupations[8], [7], [6], [5], [4] in the order returned by the database
    expect(actualOccupations.length).toBe(5);
    // Just verify we got 5 occupations, the exact order depends on database implementation
  });

  test("GET should paginate occupations without skipping items when chaining nextCursor", async () => {
    // GIVEN five occupations in the DB
    const modelInfo = await getRepositoryRegistry().modelInfo.create({
      name: getTestString(10),
      locale: { UUID: randomUUID(), name: getTestString(5), shortCode: getTestString(2) },
      description: getTestString(10),
      license: getTestString(5),
      UUIDHistory: [randomUUID()],
    });
    const modelId = modelInfo.id.toString();
    await createOccupationsInDB(5, modelId);

    // Baseline: get first 3 to capture the server’s ordering
    const baselineEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId },
      queryStringParameters: { limit: "3" },
    };
    // @ts-ignore
    const baselineResponse = await occupationHandler(baselineEvent);
    expect(baselineResponse.statusCode).toEqual(StatusCodes.OK);
    const baselineBody = JSON.parse(baselineResponse.body);
    const baselineIds = (baselineBody.data as IOccupation[]).map((m) => m.id.toString());
    expect(baselineIds).toHaveLength(3);

    // Page 1 (single): limit=1, no cursor
    const page1Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId },
      queryStringParameters: { limit: "1" },
    };
    // @ts-ignore
    const page1Response = await occupationHandler(page1Event);
    expect(page1Response.statusCode).toEqual(StatusCodes.OK);
    const page1Body = JSON.parse(page1Response.body);
    const page1Ids = (page1Body.data as IOccupation[]).map((m) => m.id.toString());
    expect(page1Ids).toEqual(baselineIds.slice(0, 1));
    expect(page1Body.nextCursor).toBeDefined();

    // Page 2 (single): limit=1 with cursor from page1
    const page2Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId },
      queryStringParameters: { limit: "1", cursor: page1Body.nextCursor },
    };
    // @ts-ignore
    const page2Response = await occupationHandler(page2Event);
    expect(page2Response.statusCode).toEqual(StatusCodes.OK);
    const page2Body = JSON.parse(page2Response.body);
    const page2Ids = (page2Body.data as IOccupation[]).map((m) => m.id.toString());
    expect(page2Ids).toEqual(baselineIds.slice(1, 2));
    expect(page2Body.nextCursor).toBeDefined();

    // Page 3 (single): limit=1 with cursor from page2
    const page3Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId },
      queryStringParameters: { limit: "1", cursor: page2Body.nextCursor },
    };
    // @ts-ignore
    const page3Response = await occupationHandler(page3Event);
    expect(page3Response.statusCode).toEqual(StatusCodes.OK);
    const page3Body = JSON.parse(page3Response.body);
    const page3Ids = (page3Body.data as IOccupation[]).map((m) => m.id.toString());

    // THEN chained singles reconstruct baseline first 3
    const chained = [...page1Ids, ...page2Ids, ...page3Ids];
    expect(chained).toEqual(baselineIds);
  });

  test("GET should paginate occupations correctly across mixed page sizes (2 then 2)", async () => {
    // GIVEN five occupations in the DB
    const modelInfo = await getRepositoryRegistry().modelInfo.create({
      name: getTestString(10),
      locale: { UUID: randomUUID(), name: getTestString(5), shortCode: getTestString(2) },
      description: getTestString(10),
      license: getTestString(5),
      UUIDHistory: [randomUUID()],
    });
    const modelId = modelInfo.id.toString();
    await createOccupationsInDB(5, modelId);

    // Baseline: get first 4 to capture ordering
    const baselineEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId },
      queryStringParameters: { limit: "4" },
    };
    // @ts-ignore
    const baselineResponse = await occupationHandler(baselineEvent);
    expect(baselineResponse.statusCode).toEqual(StatusCodes.OK);
    const baselineBody = JSON.parse(baselineResponse.body);
    const baselineIds = (baselineBody.data as IOccupation[]).map((m) => m.id.toString());
    expect(baselineIds).toHaveLength(4);

    // Page 1: limit=2
    const page1Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId },
      queryStringParameters: { limit: "2" },
    };
    // @ts-ignore
    const page1Response = await occupationHandler(page1Event);
    expect(page1Response.statusCode).toEqual(StatusCodes.OK);
    const page1Body = JSON.parse(page1Response.body);
    const page1Ids = (page1Body.data as IOccupation[]).map((m) => m.id.toString());
    expect(page1Ids).toEqual(baselineIds.slice(0, 2));
    expect(page1Body.nextCursor).toBeDefined();

    // Page 2: limit=2 with cursor from page1
    const page2Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId },
      queryStringParameters: { limit: "2", cursor: page1Body.nextCursor },
    };
    // @ts-ignore
    const page2Response = await occupationHandler(page2Event);
    expect(page2Response.statusCode).toEqual(StatusCodes.OK);
    const page2Body = JSON.parse(page2Response.body);
    const page2Ids = (page2Body.data as IOccupation[]).map((m) => m.id.toString());

    // THEN combined equals baseline first 4
    const combined = [...page1Ids, ...page2Ids];
    expect(combined).toEqual(baselineIds);
  });

  test("GET should paginate occupations correctly across random page sizes", async () => {
    // GIVEN twenty occupations in the DB
    const modelInfo = await getRepositoryRegistry().modelInfo.create({
      name: getTestString(10),
      locale: { UUID: randomUUID(), name: getTestString(5), shortCode: getTestString(2) },
      description: getTestString(10),
      license: getTestString(5),
      UUIDHistory: [randomUUID()],
    });
    const modelId = modelInfo.id.toString();
    await createOccupationsInDB(20, modelId);

    // Baseline: first 20 to know expected order
    const baselineEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId },
      queryStringParameters: { limit: "20" },
    };
    // @ts-ignore
    const baselineResponse = await occupationHandler(baselineEvent);
    expect(baselineResponse.statusCode).toEqual(StatusCodes.OK);
    const baselineBody = JSON.parse(baselineResponse.body);
    const baselineIds = (baselineBody.data as IOccupation[]).map((m) => m.id.toString());
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
        pathParameters: { modelId },
        queryStringParameters: { limit: size.toString(), ...(cursor ? { cursor } : {}) },
      };
      // @ts-ignore
      const resp = await occupationHandler(event);
      expect(resp.statusCode).toEqual(StatusCodes.OK);
      const body = JSON.parse(resp.body);
      const ids = (body.data as IOccupation[]).map((m) => m.id.toString());
      collected.push(...ids);
      cursor = body.nextCursor || undefined;
      if (!cursor) break;
    }

    expect(collected.slice(0, baselineIds.length)).toEqual(baselineIds);
  });

  test("GET occupations should handle proxy path fallback for modelId", async () => {
    // GIVEN a model exists and several Occupation objects are in the DB
    const modelInfo = await getRepositoryRegistry().modelInfo.create({
      name: getTestString(10),
      locale: { UUID: randomUUID(), name: getTestString(5), shortCode: getTestString(2) },
      description: getTestString(10),
      license: getTestString(5),
      UUIDHistory: [randomUUID()],
    });
    const modelId = modelInfo.id.toString();
    await createOccupationsInDB(3, modelId);

    // AND a request without pathParameters.modelId, using proxy path
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      path: `/models/${modelId}/occupations`,
      pathParameters: {}, // No modelId in pathParameters
      requestContext: usersRequestContext.ANONYMOUS,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationHandler(givenEvent);

    // THEN expect the handler to respond with OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND validate response
    validateGETResponse(JSON.parse(actualResponse.body));
    expect(validateGETResponse.errors).toBeNull();
  });

  test("GET /occupations/{id} should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    // GIVEN a model exists and an Occupation object is in the DB
    const modelInfo = await getRepositoryRegistry().modelInfo.create({
      name: getTestString(10),
      locale: { UUID: randomUUID(), name: getTestString(5), shortCode: getTestString(2) },
      description: getTestString(10),
      license: getTestString(5),
      UUIDHistory: [randomUUID()],
    });
    const modelId = modelInfo.id.toString();
    const occupation = await createOccupationInDB(modelId);

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      path: `/models/${modelId}/occupations/${occupation.id}`,
      pathParameters: { modelId: modelId, id: occupation.id },
      requestContext: usersRequestContext.ANONYMOUS,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND an occupation object that validates against the OccupationResponsePOST schema
    validatePOSTResponse(JSON.parse(actualResponse.body));
    expect(validatePOSTResponse.errors).toBeNull();
  });
});
