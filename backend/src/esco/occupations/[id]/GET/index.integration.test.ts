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
import { IOccupation } from "../../_shared/occupation.types";
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

describe("Test for occupation Detail GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationAPISpecs.POST.Schemas.Response.Payload); // Reuse POST response schema for single entity
  const validatePOSTResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.POST.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationDetailHandlerTestDB");
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

  test("GET /occupations/{id} should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const givenOccupation = await createOccupationInDB(givenModelId);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/occupations/${givenOccupation.id}`,
      pathParameters: { modelId: givenModelId, id: givenOccupation.id },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(validatePOSTResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    expect(JSON.parse(actualResponse.body).id).toEqual(givenOccupation.id);
  });
});
