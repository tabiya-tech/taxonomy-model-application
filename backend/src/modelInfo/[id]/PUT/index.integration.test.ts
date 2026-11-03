// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "crypto";
import { Connection } from "mongoose";

import LocaleAPISpecs from "api-specifications/locale";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LanguageAPISpecs from "api-specifications/language";

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
import { IModelInfo, IUpdateModelInfoSpec } from "modelInfo/modelInfo.types";

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

function getValidPutBody(model: IModelInfo, overrides: Partial<IUpdateModelInfoSpec> = {}): IUpdateModelInfoSpec {
  return {
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    availableLanguages: model.availableLanguages,
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    UUIDHistory: [model.UUID],
    ...overrides,
  };
}

function getEvent(modelId: string, requestContext: object, body: object) {
  return {
    httpMethod: HTTP_VERBS.PUT,
    path: `/models/${modelId}`,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    requestContext,
  };
}

describe("Test for the PUT model handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(LocaleAPISpecs.Schemas.Payload);
  ajv.addSchema(ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Response.Payload);
  const validatePUTResponse: ValidateFunction = ajv.getSchema(
    ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("ModelPUTHandlerTestDB");
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

  test("PUT should respond with OK, persist all six fields, and match the response schema", async () => {
    const givenModel = await createModelInDB();
    const givenBody = getValidPutBody(givenModel, {
      availableLanguages: LanguageAPISpecs.Constants.Languages.map((language) => language.shortCode),
    });
    const givenEvent = getEvent(givenModel.id, usersRequestContext.MODEL_MANAGER, givenBody);

    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualPayload = JSON.parse(actualResponse.body);
    validatePUTResponse(actualPayload);
    expect(validatePUTResponse.errors).toBeNull();
    expect(actualPayload).toMatchObject({
      id: givenModel.id,
      UUID: givenModel.UUID,
      name: givenBody.name,
      description: givenBody.description,
      license: givenBody.license,
      locale: givenBody.locale,
      availableLanguages: givenBody.availableLanguages,
      released: false,
    });

    const actualPersistedModel = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualPersistedModel).toMatchObject({
      name: givenBody.name,
      description: givenBody.description,
      license: givenBody.license,
      locale: givenBody.locale,
      availableLanguages: givenBody.availableLanguages,
      UUIDHistory: givenBody.UUIDHistory,
      released: false,
    });
  });

  test("PUT should respond with the BAD_REQUEST status code when the request drops a language of the model", async () => {
    const givenAvailableLanguages = LanguageAPISpecs.Constants.Languages.map((language) => language.shortCode);
    const givenModel = await createModelInDB();
    await getRepositoryRegistry().modelInfo.updateAvailableLanguages(givenModel.id, givenAvailableLanguages);
    const givenEvent = getEvent(
      givenModel.id,
      usersRequestContext.MODEL_MANAGER,
      getValidPutBody(givenModel, {
        availableLanguages: [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode],
      })
    );

    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status400.ErrorCodes.AVAILABLE_LANGUAGES_REMOVAL_NOT_SUPPORTED
    );
    const actualPersistedModel = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualPersistedModel?.availableLanguages).toEqual(givenAvailableLanguages);
  });

  test("PUT should respond with the BAD_REQUEST status code when UUIDHistory does not include the current UUID", async () => {
    const givenModel = await createModelInDB();
    const givenEvent = getEvent(
      givenModel.id,
      usersRequestContext.MODEL_MANAGER,
      getValidPutBody(givenModel, { UUIDHistory: [randomUUID()] })
    );

    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status400.ErrorCodes.UUID_HISTORY_MISSING_CURRENT_UUID
    );
  });

  test("PUT should respond with the FORBIDDEN status code if the user is not a model manager", async () => {
    const givenModel = await createModelInDB();
    const givenEvent = getEvent(givenModel.id, usersRequestContext.REGISTED_USER, getValidPutBody(givenModel));

    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    const actualPersistedModel = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualPersistedModel?.name).toEqual(givenModel.name);
  });

  test("PUT should respond with the CONFLICT status code when the model is already released", async () => {
    const givenModel = await createModelInDB();
    await getRepositoryRegistry().modelInfo.releaseModel(givenModel.id);
    const givenEvent = getEvent(givenModel.id, usersRequestContext.MODEL_MANAGER, getValidPutBody(givenModel));

    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status409.ErrorCodes.MODEL_IS_RELEASED
    );
  });

  test("PUT should respond with the NOT_FOUND status code when the model does not exist", async () => {
    const givenEvent = getEvent(getMockStringId(999), usersRequestContext.MODEL_MANAGER, {
      name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      },
      availableLanguages: [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode],
      license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
      UUIDHistory: [randomUUID()],
    });

    // @ts-ignore
    const actualResponse = await modelInstanceHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
  });
});
