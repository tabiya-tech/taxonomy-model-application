// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "crypto";
import { Connection } from "mongoose";

import LocaleAPISpecs from "api-specifications/locale";
import ModelInfoAPISpecs from "api-specifications/modelInfo";

import { handler as modelInstanceHandler } from "modelInfo/[id]";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getTestString } from "_test_utilities/getMockRandomData";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { usersRequestContext } from "_test_utilities/dataModel";
import { ModelName as ModelInfoModelName } from "modelInfo/modelInfoModel";
import { IModelInfo } from "modelInfo/modelInfo.types";

async function createModelInDB(): Promise<IModelInfo> {
  const modelInfoRepository = getRepositoryRegistry().modelInfo;
  return modelInfoRepository.create({
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

function getEvent(modelId: string, requestContext: object) {
  return {
    httpMethod: HTTP_VERBS.GET,
    path: `/models/${modelId}`,
    headers: {},
    requestContext,
  };
}

describe("Test for the GET model handler with a DB", () => {
  // set up the ajv validate GET response function
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(LocaleAPISpecs.Schemas.Payload);
  ajv.addSchema(ModelInfoAPISpecs.ModelInfo.GET.Schemas.Response.Payload);

  const validateGETResponse: ValidateFunction = ajv.getSchema(
    ModelInfoAPISpecs.ModelInfo.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelGETHandlerTestDB");
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
      await dbConnection.models[ModelInfoModelName].deleteMany({});
    }
  });

  test("GET should respond with the NOT_FOUND status code when the model does not exist", async () => {
    // GIVEN a model that does not exist in the DB
    const givenNonExistentModelId = getMockStringId(999);
    // AND a valid request from a model manager to release the model
    const givenEvent = getEvent(givenNonExistentModelId, usersRequestContext.MODEL_MANAGER);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    // THEN expect the handler to respond with the NOT_FOUND status code and the MODEL_NOT_FOUND_BY_ID error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
  });

  test("GET should respond with OK and match the response schema when a model manager requests an unreleased model", async () => {
    // GIVEN an unreleased model in the DB
    const givenModel = await createModelInDB();
    // AND a request from a model manager
    const givenEvent = getEvent(givenModel.id, usersRequestContext.MODEL_MANAGER);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND the response passes the JSON Schema validation
    const actualPayload = JSON.parse(actualResponse.body);
    validateGETResponse(actualPayload);
    expect(validateGETResponse.errors).toBeNull();
    // AND the response is the model that was requested
    expect(actualPayload.id).toEqual(givenModel.id);
  });

  test("GET should respond with the NOT_FOUND status code when a registered user requests an unreleased model", async () => {
    // GIVEN an unreleased model in the DB
    const givenModel = await createModelInDB();
    // AND a request from a user that is not a model manager
    const givenEvent = getEvent(givenModel.id, usersRequestContext.REGISTED_USER);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    // THEN expect the handler to respond with NOT_FOUND, hiding the existence of the model
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
  });

  test("GET should respond with OK and match the response schema when a registered user requests a released model", async () => {
    // GIVEN a released model in the DB
    const givenModel = await createModelInDB();
    await getRepositoryRegistry().modelInfo.releaseModel(givenModel.id);
    // AND a request from a user that is not a model manager
    const givenEvent = getEvent(givenModel.id, usersRequestContext.REGISTED_USER);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND the response passes the JSON Schema validation
    const actualPayload = JSON.parse(actualResponse.body);
    validateGETResponse(actualPayload);
    expect(validateGETResponse.errors).toBeNull();
    expect(actualPayload.id).toEqual(givenModel.id);
  });
});
