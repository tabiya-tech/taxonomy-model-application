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

function getEvent(modelId: string, requestContext: object, body: object = { released: true }) {
  return {
    httpMethod: HTTP_VERBS.PATCH,
    path: `/models/${modelId}`,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    requestContext,
  };
}

describe("Test for the PATCH model (release) handler with a DB", () => {
  // set up the ajv validate PATCH response function
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(LocaleAPISpecs.Schemas.Payload);
  ajv.addSchema(ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Response.Payload);
  const validatePATCHResponse: ValidateFunction = ajv.getSchema(
    ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;
  // ---

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelPATCHHandlerTestDB");
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

  test("PATCH should respond with OK, persist released and releaseNotes, and match the response schema", async () => {
    // GIVEN an unreleased model in the DB
    const givenModel = await createModelInDB();
    // AND a valid request from a model manager to release the model
    const givenEvent = getEvent(givenModel.id, usersRequestContext.MODEL_MANAGER, {
      released: true,
      releaseNotes: "Initial release",
    });

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND the response passes the JSON Schema validation
    const actualPayload = JSON.parse(actualResponse.body);
    validatePATCHResponse(actualPayload);
    expect(validatePATCHResponse.errors).toBeNull();
    // AND the response to reflect the released state
    expect(actualPayload).toMatchObject({
      id: givenModel.id,
      released: true,
      releaseNotes: "Initial release",
    });

    // AND the change to be persisted in the DB
    const actualPersistedModel = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualPersistedModel?.released).toBe(true);
    expect(actualPersistedModel?.releaseNotes).toEqual("Initial release");
  });

  test("PATCH should respond with the FORBIDDEN status code if the user is not a model manager", async () => {
    // GIVEN an unreleased model in the DB
    const givenModel = await createModelInDB();
    // AND a valid request from a user that is not a model manager
    const givenEvent = getEvent(givenModel.id, usersRequestContext.REGISTED_USER);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    // THEN expect the handler to respond with the FORBIDDEN status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    // AND expect the model to remain unreleased
    const actualPersistedModel = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualPersistedModel?.released).toBe(false);
  });

  test("PATCH should respond with the CONFLICT status code when the model is already released", async () => {
    // GIVEN a model in the DB that is already released
    const givenModel = await createModelInDB();
    await getRepositoryRegistry().modelInfo.releaseModel(givenModel.id);
    // AND a valid request from a model manager to release the model again
    const givenEvent = getEvent(givenModel.id, usersRequestContext.MODEL_MANAGER);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    // THEN expect the handler to respond with the CONFLICT status code and the MODEL_ALREADY_RELEASED error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status409.ErrorCodes.MODEL_ALREADY_RELEASED
    );
  });

  test("PATCH should respond with the NOT_FOUND status code when the model does not exist", async () => {
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
      ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
  });

  test("PATCH should respond with the BAD_REQUEST status code when the body is malformed", async () => {
    // GIVEN an unreleased model in the DB
    const givenModel = await createModelInDB();
    // AND a request with a malformed body
    const givenEvent = {
      ...getEvent(givenModel.id, usersRequestContext.MODEL_MANAGER),
      body: "{ not json",
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    // THEN expect the handler to respond with the BAD_REQUEST status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND expect the model to remain unreleased
    const actualPersistedModel = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualPersistedModel?.released).toBe(false);
  });
});
