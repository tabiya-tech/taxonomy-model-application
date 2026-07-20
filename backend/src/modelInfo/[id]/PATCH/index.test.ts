// silence chatty console
import "_test_utilities/consoleMock";

import * as authenticatorModule from "auth/authorizer";
import * as config from "server/config/config";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ModelPATCHHandler } from "./index";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import ErrorAPISpecs from "api-specifications/error";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getIModelInfoMockData } from "../../testDataHelper";
import { IModelInfo, IModelInfoReference } from "../../modelInfo.types";
import { usersRequestContext } from "_test_utilities/dataModel";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");

const givenModelId = getMockStringId(1);

function getEvent(options: { body?: string; modelId?: string | null; contentType?: string }): APIGatewayProxyEvent {
  const modelId = options.modelId === undefined ? givenModelId : options.modelId;
  const path = modelId === null ? "/models" : `/models/${modelId}`;
  return {
    httpMethod: HTTP_VERBS.PATCH,
    path,
    body: options.body ?? JSON.stringify({ released: true }),
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
  };
}

describe("Test the ModelPATCHHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRole.mockResolvedValue(true);
  });

  test("should respond with FORBIDDEN if the user is not a model manager", async () => {
    // GIVEN the user is not a model manager
    checkRole.mockResolvedValue(false);
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({}));

    // THEN expect a FORBIDDEN response
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    // AND expect the repository to not be called
    expect(givenModelInfoRepositoryMock.releaseModel).not.toHaveBeenCalled();
  });

  test("should respond with OK and the released model when releaseNotes is provided", async () => {
    // GIVEN releaseModel will succeed
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenReleasedModel: IModelInfo = { ...givenModel, released: true, releaseNotes: "some notes" };
    const givenUuidHistoryDetails: IModelInfoReference[] = [
      {
        id: givenModelId,
        UUID: givenModel.UUID,
        name: givenModel.name,
        version: givenModel.version,
        localeShortCode: "NA",
      },
    ];
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.releaseModel.mockResolvedValue(givenReleasedModel);
    givenModelInfoRepositoryMock.getHistory.mockResolvedValue(givenUuidHistoryDetails);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);
    const givenResourcesBaseUrl = "https://some/path/to/api/resources";
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);

    // WHEN the handler is invoked with releaseNotes
    const actualResponse = await new ModelPATCHHandler().handle(
      getEvent({ body: JSON.stringify({ released: true, releaseNotes: "some notes" }) })
    );

    // THEN expect the repository to be called with the modelId and releaseNotes
    expect(givenModelInfoRepositoryMock.releaseModel).toHaveBeenCalledWith(givenModelId, "some notes");
    // AND expect getModelById to not be called, since releaseModel already returned the updated model
    expect(givenModelInfoRepositoryMock.getModelById).not.toHaveBeenCalled();
    // AND expect a 200 response with the released model
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body).released).toBe(true);
  });

  test("should respond with OK when releaseNotes is omitted", async () => {
    // GIVEN releaseModel will succeed
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenReleasedModel: IModelInfo = { ...givenModel, released: true };
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.releaseModel.mockResolvedValue(givenReleasedModel);
    givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked without releaseNotes
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({ body: JSON.stringify({ released: true }) }));

    // THEN expect the repository to be called with the modelId and undefined releaseNotes
    expect(givenModelInfoRepositoryMock.releaseModel).toHaveBeenCalledWith(givenModelId, undefined);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
  });

  test("should respond with NOT_FOUND when the model does not exist", async () => {
    // GIVEN releaseModel finds no matching unreleased model, and a diagnostic fetch confirms it doesn't exist at all
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.releaseModel.mockResolvedValue(null);
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(null);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({}));

    // THEN expect a 404 response with the MODEL_NOT_FOUND_BY_ID error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
    // AND expect the diagnostic fetch to have been made with the same modelId
    expect(givenModelInfoRepositoryMock.getModelById).toHaveBeenCalledWith(givenModelId);
  });

  test("should respond with NOT_FOUND when the modelId in the path is not a valid ObjectId", async () => {
    // GIVEN an event whose modelId is not a valid ObjectId
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({ modelId: "not-a-valid-object-id" }));

    // THEN expect a 404 response
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
    // AND expect the repository to not be called at all
    expect(givenModelInfoRepositoryMock.releaseModel).not.toHaveBeenCalled();
    expect(givenModelInfoRepositoryMock.getModelById).not.toHaveBeenCalled();
  });

  test("should respond with CONFLICT when the model is already released", async () => {
    // GIVEN releaseModel finds no matching unreleased model, and a diagnostic fetch shows it exists and is released
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: true };
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.releaseModel.mockResolvedValue(null);
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({}));

    // THEN expect a 409 response with the MODEL_ALREADY_RELEASED error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status409.ErrorCodes.MODEL_ALREADY_RELEASED
    );
  });

  test("should respond with BAD_REQUEST when the modelId is missing in the path", async () => {
    // GIVEN an event whose path does not contain a modelId
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({ modelId: null }));

    // THEN expect a 400 response with the INVALID_JSON_SCHEMA error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    // AND expect the repository to not be called
    expect(givenModelInfoRepositoryMock.releaseModel).not.toHaveBeenCalled();
  });

  test("should respond with UNSUPPORTED_MEDIA_TYPE when the content type is not json", async () => {
    // GIVEN an event with an invalid content type
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({ contentType: "text/html" }));

    // THEN expect a 415 response
    expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
  });

  test("should respond with TOO_LARGE_PAYLOAD when the payload is too large", async () => {
    // GIVEN an event with a payload that is too large
    const actualResponse = await new ModelPATCHHandler().handle(
      getEvent({
        body: JSON.stringify({
          released: true,
          releaseNotes: "a".repeat(ModelInfoAPISpecs.ModelInfo.PATCH.Constants.MAX_PATCH_PAYLOAD_LENGTH + 1),
        }),
      })
    );

    // THEN expect a 413 response
    expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
  });

  test("should respond with BAD_REQUEST when the body is malformed", async () => {
    // GIVEN an event with a malformed body
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({ body: "{ not json" }));

    // THEN expect a 400 response with the MALFORMED_BODY error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY);
  });

  test.each([
    ["released is false", { released: false }],
    ["released is missing", { releaseNotes: "some notes" }],
    ["there is an unknown property", { released: true, foo: "bar" }],
  ])("should respond with BAD_REQUEST when %s", async (_description, givenBody) => {
    // GIVEN an event with a body that does not conform to the schema
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({ body: JSON.stringify(givenBody) }));

    // THEN expect a 400 response with the INVALID_JSON_SCHEMA error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
  });

  test("should respond with INTERNAL_SERVER_ERROR when releaseModel fails unexpectedly", async () => {
    // GIVEN releaseModel fails
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.releaseModel.mockRejectedValue(new Error("DB failure"));
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({}));

    // THEN expect a 500 response with the DB_FAILED_TO_RELEASE_MODEL error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RELEASE_MODEL
    );
  });

  test("should respond with INTERNAL_SERVER_ERROR when the diagnostic getModelById fails unexpectedly", async () => {
    // GIVEN releaseModel finds no matching unreleased model, and the diagnostic fetch to tell 404 from 409 apart fails
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.releaseModel.mockResolvedValue(null);
    givenModelInfoRepositoryMock.getModelById.mockRejectedValue(new Error("DB failure"));
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({}));

    // THEN expect a 500 response with the DB_FAILED_TO_RELEASE_MODEL error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RELEASE_MODEL
    );
  });

  test("should respond with INTERNAL_SERVER_ERROR when getHistory fails after a successful release", async () => {
    // GIVEN a successful release but getHistory fails
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenReleasedModel: IModelInfo = { ...givenModel, released: true };
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.releaseModel.mockResolvedValue(givenReleasedModel);
    givenModelInfoRepositoryMock.getHistory.mockRejectedValue(new Error("DB failure"));
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelPATCHHandler().handle(getEvent({}));

    // THEN expect a 500 response with the DB_FAILED_TO_RELEASE_MODEL error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RELEASE_MODEL
    );
  });
});
