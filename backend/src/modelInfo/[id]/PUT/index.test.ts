// silence chatty console
import "_test_utilities/consoleMock";

import * as authenticatorModule from "auth/authorizer";
import * as config from "server/config/config";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ModelPUTHandler } from "./index";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LanguageAPISpecs from "api-specifications/language";
import LocaleAPISpecs from "api-specifications/locale";
import ErrorAPISpecs from "api-specifications/error";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getIModelInfoMockData } from "../../testDataHelper";
import { IModelInfo, IModelInfoReference, IUpdateModelInfoSpec } from "../../modelInfo.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getTestString } from "_test_utilities/getMockRandomData";
import { randomUUID } from "crypto";
import { transform } from "modelInfo/transform";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");

const givenModelId = getMockStringId(1);

function getValidPutPayload(model: IModelInfo, overrides: Partial<IUpdateModelInfoSpec> = {}) {
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

function getEvent(options: { body?: string; modelId?: string | null; contentType?: string }): APIGatewayProxyEvent {
  const modelId = options.modelId === undefined ? givenModelId : options.modelId;
  const path = modelId === null ? "/models" : `/models/${modelId}`;
  return {
    httpMethod: HTTP_VERBS.PUT,
    path,
    body: options.body ?? "{}",
    headers: {
      "Content-Type": options.contentType ?? "application/json",
    },
    requestContext: usersRequestContext.MODEL_MANAGER,
  } as never;
}

function getModelInfoRepositoryMock() {
  return {
    Model: undefined as never,
    create: jest.fn(),
    getModelById: jest.fn(),
    getModelByUUID: jest.fn(),
    getModels: jest.fn(),
    getHistory: jest.fn(),
    getModelsByIds: jest.fn(),
    releaseModel: jest.fn(),
    replaceModel: jest.fn(),
    updateAvailableLanguages: jest.fn(),
  };
}

describe("Test the ModelPUTHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRole.mockResolvedValue(true);
  });

  test("should respond with FORBIDDEN if the user is not a model manager", async () => {
    checkRole.mockResolvedValue(false);
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({}));

    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    expect(givenModelInfoRepositoryMock.replaceModel).not.toHaveBeenCalled();
  });

  test("should respond with OK and the complete transformed model when all six fields are replaced", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenPayload = getValidPutPayload(givenModel, {
      availableLanguages: LanguageAPISpecs.Constants.Languages.map((language) => language.shortCode),
    });
    const givenUpdatedModel: IModelInfo = {
      ...givenModel,
      ...givenPayload,
    };
    const givenUuidHistoryDetails: IModelInfoReference[] = [
      {
        id: givenModelId,
        UUID: givenModel.UUID,
        name: givenPayload.name,
        version: givenModel.version,
        localeShortCode: givenPayload.locale.shortCode,
      },
    ];
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    givenModelInfoRepositoryMock.replaceModel.mockResolvedValue(givenUpdatedModel);
    givenModelInfoRepositoryMock.getHistory.mockResolvedValue(givenUuidHistoryDetails);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);
    const givenResourcesBaseUrl = "https://some/path/to/api/resources";
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(givenModelInfoRepositoryMock.replaceModel).toHaveBeenCalledWith(
      givenModelId,
      givenPayload,
      givenModel.availableLanguages
    );
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body)).toEqual(
      transform(givenUpdatedModel, givenResourcesBaseUrl, givenUuidHistoryDetails)
    );
  });

  test("should respond with OK when availableLanguages adds a language", async () => {
    const givenFallbackShortCode = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;
    const givenAllRegisteredShortCodes = LanguageAPISpecs.Constants.Languages.map((language) => language.shortCode);
    const givenModel: IModelInfo = {
      ...getIModelInfoMockData(),
      id: givenModelId,
      released: false,
      availableLanguages: [givenFallbackShortCode],
    };
    const givenPayload = getValidPutPayload(givenModel, { availableLanguages: givenAllRegisteredShortCodes });
    const givenUpdatedModel: IModelInfo = { ...givenModel, ...givenPayload };
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    givenModelInfoRepositoryMock.replaceModel.mockResolvedValue(givenUpdatedModel);
    givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body).availableLanguages).toEqual(givenAllRegisteredShortCodes);
  });

  test("should respond with NOT_FOUND when the model does not exist", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId };
    const givenPayload = getValidPutPayload(givenModel);
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(null);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
    expect(givenModelInfoRepositoryMock.replaceModel).not.toHaveBeenCalled();
  });

  test("should respond with NOT_FOUND when the modelId in the path is not a valid ObjectId", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId };
    const givenPayload = getValidPutPayload(givenModel);
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(
      getEvent({ body: JSON.stringify(givenPayload), modelId: "not-a-valid-object-id" })
    );

    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
    expect(givenModelInfoRepositoryMock.getModelById).not.toHaveBeenCalled();
  });

  test("should respond with CONFLICT when the model is released", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: true };
    const givenPayload = getValidPutPayload(givenModel);
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status409.ErrorCodes.MODEL_IS_RELEASED
    );
    expect(givenModelInfoRepositoryMock.replaceModel).not.toHaveBeenCalled();
  });

  test("should respond with CONFLICT when the model becomes released between the read and the update", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenReleasedModel: IModelInfo = { ...givenModel, released: true };
    const givenPayload = getValidPutPayload(givenModel);
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById
      .mockResolvedValueOnce(givenModel)
      .mockResolvedValueOnce(givenReleasedModel);
    givenModelInfoRepositoryMock.replaceModel.mockResolvedValue(null);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status409.ErrorCodes.MODEL_IS_RELEASED
    );
  });

  test("should reject an update that would drop a language added concurrently", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const concurrentLanguage = LanguageAPISpecs.Constants.Languages.find(
      (language) => !givenModel.availableLanguages.includes(language.shortCode)
    )?.shortCode;
    if (concurrentLanguage === undefined) {
      throw new Error("Expected at least one registered language not present in the model");
    }
    const givenUpdatedModel: IModelInfo = {
      ...givenModel,
      availableLanguages: [...givenModel.availableLanguages, concurrentLanguage],
    };
    const givenPayload = getValidPutPayload(givenModel);
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById
      .mockResolvedValueOnce(givenModel)
      .mockResolvedValueOnce(givenUpdatedModel);
    givenModelInfoRepositoryMock.replaceModel.mockResolvedValue(null);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status400.ErrorCodes.AVAILABLE_LANGUAGES_REMOVAL_NOT_SUPPORTED
    );
    expect(givenModelInfoRepositoryMock.replaceModel).toHaveBeenCalledWith(
      givenModelId,
      expect.objectContaining({ availableLanguages: givenPayload.availableLanguages }),
      givenModel.availableLanguages
    );
  });

  test("should respond with CONFLICT when a compatible concurrent model update occurred", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const concurrentlyAddedLanguage = LanguageAPISpecs.Constants.Languages.find(
      (language) => !givenModel.availableLanguages.includes(language.shortCode)
    )?.shortCode;
    if (concurrentlyAddedLanguage === undefined) {
      throw new Error("Expected at least one registered language not present in the model");
    }
    const givenUpdatedModel: IModelInfo = {
      ...givenModel,
      availableLanguages: [...givenModel.availableLanguages, concurrentlyAddedLanguage],
    };
    const givenPayload = getValidPutPayload(givenModel, {
      availableLanguages: givenUpdatedModel.availableLanguages,
    });
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById
      .mockResolvedValueOnce(givenModel)
      .mockResolvedValueOnce(givenUpdatedModel);
    givenModelInfoRepositoryMock.replaceModel.mockResolvedValue(null);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status409.ErrorCodes.MODEL_CHANGED_CONCURRENTLY
    );
  });

  test("should respond with NOT_FOUND when the model is deleted between the read and the update", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenPayload = getValidPutPayload(givenModel);
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValueOnce(givenModel).mockResolvedValueOnce(null);
    givenModelInfoRepositoryMock.replaceModel.mockResolvedValue(null);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
  });

  test("should respond with BAD_REQUEST when the modelId is missing in the path", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId };
    const givenPayload = getValidPutPayload(givenModel);
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(
      getEvent({ body: JSON.stringify(givenPayload), modelId: null })
    );

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    expect(givenModelInfoRepositoryMock.replaceModel).not.toHaveBeenCalled();
  });

  test("should respond with UNSUPPORTED_MEDIA_TYPE when the content type is not json", async () => {
    const actualResponse = await new ModelPUTHandler().handle(getEvent({ contentType: "text/html" }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
  });

  test("should respond with TOO_LARGE_PAYLOAD when the payload is too large", async () => {
    const actualResponse = await new ModelPUTHandler().handle(
      getEvent({
        body: "a".repeat(ModelInfoAPISpecs.ModelInfo.PUT.Constants.MAX_PUT_PAYLOAD_LENGTH + 1),
      })
    );

    expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
  });

  test("should respond with BAD_REQUEST when the body is malformed", async () => {
    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: "{ not json" }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY);
  });

  test.each([
    ["the payload asks for nothing", {}],
    ["name is missing", { description: "d", locale: {}, availableLanguages: ["en"], license: "l", UUIDHistory: [] }],
    ["there is an unknown property", { foo: "bar" }],
    ["released is present", { released: true }],
  ])("should respond with BAD_REQUEST when %s", async (_description, givenBody) => {
    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenBody) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
  });

  test("should respond with BAD_REQUEST when UUIDHistory is empty", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId };
    const givenPayload = getValidPutPayload(givenModel, { UUIDHistory: [] });

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
  });

  test("should respond with BAD_REQUEST when UUIDHistory contains duplicate UUIDs", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId };
    const givenPayload = getValidPutPayload(givenModel, { UUIDHistory: [givenModel.UUID, givenModel.UUID] });

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
  });

  test("should respond with BAD_REQUEST when UUIDHistory contains invalid UUIDs", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId };
    const givenPayload = getValidPutPayload(givenModel, { UUIDHistory: ["not-a-uuid"] });

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
  });

  test("should respond with BAD_REQUEST when UUIDHistory does not contain the current model UUID", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenPayload = getValidPutPayload(givenModel, { UUIDHistory: [randomUUID()] });
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status400.ErrorCodes.UUID_HISTORY_MISSING_CURRENT_UUID
    );
    expect(givenModelInfoRepositoryMock.replaceModel).not.toHaveBeenCalled();
  });

  test("should respond with BAD_REQUEST when availableLanguages is empty", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId };
    const givenPayload = getValidPutPayload(givenModel, { availableLanguages: [] });

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
  });

  test("should respond with BAD_REQUEST when availableLanguages contains an unsupported language", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId };
    const givenPayload = getValidPutPayload(givenModel, { availableLanguages: ["not-a-registered-language"] });

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
  });

  test("should respond with BAD_REQUEST when availableLanguages contains duplicates", async () => {
    const givenFallbackShortCode = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId };
    const givenPayload = getValidPutPayload(givenModel, {
      availableLanguages: [givenFallbackShortCode, givenFallbackShortCode],
    });

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
  });

  test("should respond with BAD_REQUEST when availableLanguages removes an existing language", async () => {
    const givenAllRegisteredShortCodes = LanguageAPISpecs.Constants.Languages.map((language) => language.shortCode);
    const givenFallbackShortCode = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;
    const givenModel: IModelInfo = {
      ...getIModelInfoMockData(),
      id: givenModelId,
      released: false,
      availableLanguages: givenAllRegisteredShortCodes,
    };
    const givenPayload = getValidPutPayload(givenModel, { availableLanguages: [givenFallbackShortCode] });
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status400.ErrorCodes.AVAILABLE_LANGUAGES_REMOVAL_NOT_SUPPORTED
    );
    expect(givenModelInfoRepositoryMock.replaceModel).not.toHaveBeenCalled();
  });

  test("should respond with INTERNAL_SERVER_ERROR when replaceModel fails unexpectedly", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenPayload = getValidPutPayload(givenModel);
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    givenModelInfoRepositoryMock.replaceModel.mockRejectedValue(new Error("DB failure"));
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_MODEL
    );
    expect(JSON.parse(actualResponse.body).details).toEqual("");
  });

  test("should respond with INTERNAL_SERVER_ERROR when getHistory fails after a successful replace", async () => {
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenPayload = getValidPutPayload(givenModel);
    const givenUpdatedModel: IModelInfo = { ...givenModel, ...givenPayload };
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    givenModelInfoRepositoryMock.replaceModel.mockResolvedValue(givenUpdatedModel);
    givenModelInfoRepositoryMock.getHistory.mockRejectedValue(new Error("DB failure"));
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    const actualResponse = await new ModelPUTHandler().handle(getEvent({ body: JSON.stringify(givenPayload) }));

    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_MODEL
    );
  });
});
