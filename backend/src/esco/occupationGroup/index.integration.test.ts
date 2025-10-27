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
    importId: null,
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
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      requestContext: usersRequestContext.MODEL_MANAGER,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await occupationGroupHandler(givenEvent);

    // THEN expect the handler to respond with the CREATED status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    // AND an OccupationGroup object that validates against the OccupationGroupRequest schema
    validatePOSTResponse(JSON.parse(actualResponse.body));
    expect(validatePOSTResponse.errors).toBeNull();
  });

  test("GET should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    // GIVEN several OccupationGroup objects are in the DB
    const modelId = getMockStringId(1);
    const occupationGroups = await createOccupationGroupsInDB(3, modelId);
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
      pathParameters: { modelId: modelId.toString() },
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
    const modelId = getMockStringId(1);
    const occupationGroups = await createOccupationGroupsInDB(10, modelId);
    expect(occupationGroups.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    const limit = 5;
    const cursor = Buffer.from(
      JSON.stringify({ id: occupationGroups[9].id, createdAt: occupationGroups[9].createdAt })
    ).toString("base64");

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: modelId.toString() },
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
    // The cursor points to occupationGroups[9], so we expect the 5 items older than that
    // which are occupationGroups[8], [7], [6], [5], [4] in descending order
    expect(actualOccupationGroups.map((m) => m.UUID)).toMatchObject(
      occupationGroups
        .slice(4, 9) // Get items 4-8 (5 items)
        .reverse() // Reverse to get descending order
        .map((m) => m.UUID)
    );
  });
});
