import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationAPISpecs from "api-specifications/esco/occupation";
import ModelInfoAPISpecs from "api-specifications/modelInfo";

import { getRandomString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as occupationHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupation } from "esco/occupations/_shared/occupation.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { ObjectTypes } from "esco/common/objectTypes";

async function createModelInDB() {
  return await getRepositoryRegistry().modelInfo.create({
    name: "Test Model",
    description: "Test Description",
    locale: { shortCode: "en", name: "English", UUID: randomUUID() },
    license: "MIT",
    UUIDHistory: [],
  });
}

async function createOccupationInDB(modelId: string, spec?: Partial<IOccupation>) {
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

describe("Test for occupation History GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(ModelInfoAPISpecs.Schemas.Reference);
  ajv.addSchema(OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload);
  const validateHistoryResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationHistoryHandlerTestDB");
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
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });

  test("GET /occupations/{id}/history should respond with OK and resolve the occupation's history to the models it appeared in", async () => {
    // GIVEN a prior model containing an occupation (the same occupation in an earlier model version)
    const givenPriorModel = await createModelInDB();
    const givenPriorOccupation = await createOccupationInDB(givenPriorModel.id);

    // AND a current model containing the current version of the occupation, whose UUIDHistory references
    // the prior occupation's UUID (plus a UUID that does not resolve to any occupation)
    const givenCurrentModel = await createModelInDB();
    const givenCurrentOccupation = await createOccupationInDB(givenCurrentModel.id, {
      UUIDHistory: [givenPriorOccupation.UUID, randomUUID()],
    });
    // The current occupation's own generated UUID is prepended to its UUIDHistory on create, so its history is
    // [currentUUID (current model), priorOccupation.UUID (prior model), <non-existent uuid>].

    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenCurrentModel.id}/occupations/${givenCurrentOccupation.id}/history`,
      pathParameters: { modelId: givenCurrentModel.id, id: givenCurrentOccupation.id },
    };

    // WHEN the handler is called
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK and a schema-valid body
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateHistoryResponse(actualBody)).toBeTruthy();
    // AND the two models the occupation appeared in, in UUIDHistory order (current first, then prior);
    // the UUID that does not resolve to an occupation is skipped. Each item is the occupation's reference
    // (as it was in that model) flat, plus the stripped model reference under `model`.
    expect(actualBody).toHaveLength(2);
    expect(actualBody[0].id).toEqual(givenCurrentOccupation.id);
    expect(actualBody[0].model.id).toEqual(givenCurrentModel.id);
    expect(actualBody[1].id).toEqual(givenPriorOccupation.id);
    expect(actualBody[1].model.id).toEqual(givenPriorModel.id);
  });

  test("GET /occupations/{id}/history should return only the current model for a freshly created occupation", async () => {
    // GIVEN a model and a freshly created occupation (create prepends the occupation's own new UUID to its
    // UUIDHistory, so a brand-new occupation has exactly one history entry: its own UUID in the current model)
    const givenModel = await createModelInDB();
    const givenOccupation = await createOccupationInDB(givenModel.id, { UUIDHistory: [] });
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModel.id}/occupations/${givenOccupation.id}/history`,
      pathParameters: { modelId: givenModel.id, id: givenOccupation.id },
    };

    // WHEN the handler is called
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK and exactly the occupation's current model
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateHistoryResponse(actualBody)).toBeTruthy();
    expect(actualBody).toHaveLength(1);
    expect(actualBody[0].id).toEqual(givenOccupation.id);
    expect(actualBody[0].model.id).toEqual(givenModel.id);
  });

  test("GET /occupations/{id}/history should respond with NOT_FOUND when the occupation does not exist", async () => {
    // GIVEN a model exists but the occupation does not
    const givenModel = await createModelInDB();
    const givenNonExistentOccupationId = getMockStringId(9999);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModel.id}/occupations/${givenNonExistentOccupationId}/history`,
      pathParameters: { modelId: givenModel.id, id: givenNonExistentOccupationId },
    };

    // WHEN the handler is called
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect NOT_FOUND
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      OccupationAPISpecs.GET.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND
    );
  });
});
