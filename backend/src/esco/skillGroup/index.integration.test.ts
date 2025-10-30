import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillGroupHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillGroup } from "./skillGroup.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";

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

async function createSkillGroupInDB(modelId: string = getMockStringId(1)): Promise<ISkillGroup> {
  return await getRepositoryRegistry().skillGroup.create({
    modelId: modelId,
    code: getTestSkillGroupCode(100),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
  });
}

async function createSkillGroupsInDB(count: number, modelId: string = getMockStringId(1)): Promise<ISkillGroup[]> {
  const skillGroups: ISkillGroup[] = [];
  for (let i = 0; i < count; i++) {
    skillGroups.push(await createSkillGroupInDB(modelId));
  }
  return skillGroups;
}

describe("Test for skillGroup handler with a DB", () => {
  // setup the ajv validate GET, POST, etc response functions
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv
    .addSchema(SkillGroupAPISpecs.Schemas.GET.Response.Payload)
    .addSchema(SkillGroupAPISpecs.Schemas.POST.Response.Payload)
    .addSchema(SkillGroupAPISpecs.Schemas.GET.Response.ById.Payload);
  const validateGETResponse: ValidateFunction = ajv.getSchema(
    SkillGroupAPISpecs.Schemas.GET.Response.Payload.$id as string
  ) as ValidateFunction;
  const validateSingleGETResponse: ValidateFunction = ajv.getSchema(
    SkillGroupAPISpecs.Schemas.GET.Response.ById.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillGroupHandlerTestDB");
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
      await dbConnection.models.SkillGroupModel.deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });
  test("GET should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    // GIVEN several skillGroup objects are in the DB
    const givenModelInfo = await createModelInDB();

    const skillGroups = await createSkillGroupsInDB(3, givenModelInfo.id.toString());
    expect(skillGroups.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    const limit = 2;
    const cursor = Buffer.from(JSON.stringify({ id: skillGroups[2].id, createdAt: skillGroups[2].createdAt })).toString(
      "base64"
    );

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: {
        limit: limit.toString(),
        cursor: cursor,
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await skillGroupHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND an skillGroup object that validates against the SkillGroupResponseGET schema
    validateGETResponse(JSON.parse(actualResponse.body));
    expect(validateGETResponse.errors).toBeNull();
  });

  test("GET should respond with a single skillGroup when asked for one", async () => {
    // GIVEN several skillGroup objects are in the DB
    const givenModelInfo = await createModelInDB();

    const skillGroups = await createSkillGroupsInDB(3, givenModelInfo.id.toString());
    expect(skillGroups.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString(), id: skillGroups[1].id.toString() },
      path: `/models/${givenModelInfo.id.toString()}/skillGroups/${skillGroups[1].id.toString()}`,
    };
    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await skillGroupHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND an skillGroup object that validates against the SkillGroupResponseGET schema
    validateSingleGETResponse(JSON.parse(actualResponse.body));
    expect(validateSingleGETResponse.errors).toBeNull();
  });
  test("GET should return at most the passed limit skillGroups", async () => {
    // GIVEN several SkillGroup objects are in the DB
    const givenModelInfo = await createModelInDB();
    const skillGroups = await createSkillGroupsInDB(10, givenModelInfo.id.toString());
    expect(skillGroups.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    const limit = 5;
    const cursor = Buffer.from(JSON.stringify({ id: skillGroups[8].id, createdAt: skillGroups[8].createdAt })).toString(
      "base64"
    );

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: {
        limit: limit,
        cursor: cursor,
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await skillGroupHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    const actualBody = JSON.parse(actualResponse.body);
    const actualSkillGroups = actualBody.data as ISkillGroup[];

    // AND the response skillGroups should have at most of the limit count of SkillGroups
    expect(actualSkillGroups.length).toBeLessThanOrEqual(limit);

    // AND the response skillGroups should be the expected ones
    // The cursor points to skillGroups[9], so we expect the 5 items younger than that
    // which are skillGroups[9] in descending younger
    expect(actualSkillGroups.map((m) => m.UUID)).toMatchObject(
      skillGroups
        .slice(9, 10)
        .reverse()
        .map((m) => m.UUID)
    );
  });
});
