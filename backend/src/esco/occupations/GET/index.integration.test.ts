import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import { getRandomString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as occupationHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupation } from "../_shared/occupation.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { ObjectTypes } from "esco/common/objectTypes";

async function createOccupationInDB(modelId: string = getMockStringId(1), spec?: Partial<IOccupation>) {
  return await getRepositoryRegistry().occupation.create({
    modelId: modelId,
    code: getMockRandomOccupationCode(false),
    occupationType: ObjectTypes.ESCOOccupation,
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    occupationGroupCode: getMockRandomISCOGroupCode(),
    definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
    regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
    isLocalized: false,
    ...spec,
  });
}
async function createOccupationsInDB(count: number, modelId: string = getMockStringId(1)) {
  const occupations: IOccupation[] = [];
  for (let i = 0; i < count; i++) {
    occupations.push(await createOccupationInDB(modelId));
  }
  return occupations;
}

describe("Test for occupation List GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationAPISpecs.GET.Schemas.Response.Payload);
  const validateGETResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGETHandlerTestDB");
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
      await dbConnection.models.OccupationModel.deleteMany({});
    }
  });

  test("GET should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    await createOccupationsInDB(3, givenModelId);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/occupations`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(validateGETResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    expect(JSON.parse(actualResponse.body).data.length).toEqual(3);
  });

  test("GET should return at most the passed limit occupations", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    await createOccupationsInDB(5, givenModelId);
    const givenLimit = 2;
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/occupations`,
      queryStringParameters: { limit: givenLimit.toString() },
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(validateGETResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    expect(JSON.parse(actualResponse.body).data.length).toEqual(givenLimit);
  });

  test("GET should regex-search an unreleased model's occupations by the query on the requested fields", async () => {
    // GIVEN an unreleased model with three occupations, two of which match "software" on preferredLabel
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const givenSoftwareEngineer = await createOccupationInDB(givenModelId, { preferredLabel: "Software Engineer" });
    const givenSoftwareArchitect = await createOccupationInDB(givenModelId, { preferredLabel: "software architect" });
    await createOccupationInDB(givenModelId, { preferredLabel: "Nurse" });

    // WHEN searching for "software" on preferredLabel
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/occupations`,
      queryStringParameters: { query: "software", searchFields: "preferredLabel" },
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK, a schema-valid response and only the two matching occupations
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(validateGETResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    const actualIds = JSON.parse(actualResponse.body).data.map((o: { id: string }) => o.id);
    expect(actualIds.sort()).toEqual([givenSoftwareEngineer.id, givenSoftwareArchitect.id].sort());
  });
});
