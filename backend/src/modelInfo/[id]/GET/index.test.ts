// silence chatty console
import "_test_utilities/consoleMock";
import AuthAPISpecs from "api-specifications/auth";
import * as authenticatorModule from "auth/authorizer";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ModelGETHandler } from "./index";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getIModelInfoMockData } from "../../testDataHelper";
import { IModelInfo } from "../../modelInfo.types";
import { usersRequestContext } from "_test_utilities/dataModel";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
const givenModelId = getMockStringId(1);
function mockUserRole(isModelManager: boolean) {
  checkRole.mockImplementation(async (_event: APIGatewayProxyEvent, role: AuthAPISpecs.Enums.TabiyaRoles) => {
    // everyone has the ANONYMOUS role, so the @RoleRequired decorator lets the request through
    if (role === AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS) return true;
    // only a model manager has the MODEL_MANAGER role
    return isModelManager && role === AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;
  });
}

function getEvent(options: { modelId?: string | null } = {}): APIGatewayProxyEvent {
  const modelId = options.modelId === undefined ? givenModelId : options.modelId;
  return {
    httpMethod: HTTP_VERBS.GET,
    path: modelId === null ? "/models" : `/models/${modelId}`,
    headers: {},
    requestContext: usersRequestContext.REGISTED_USER,
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
    updateAvailableLanguages: jest.fn(),
  };
}

describe("Test the ModelGETHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // checkRole.mockResolvedValue(false);
    mockUserRole(false);
  });

  test("should respond with NOT_FOUND when the model does not exist", async () => {
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(null);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelGETHandler().handle(getEvent({}));

    // THEN expect a 404 response with the MODEL_NOT_FOUND_BY_ID error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
    expect(givenModelInfoRepositoryMock.getModelById).toHaveBeenCalledWith(givenModelId);
  });

  test("should respond with NOT_FOUND when the modelId in the path is not a valid ObjectId", async () => {
    // GIVEN an event whose modelId is not a valid ObjectId
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelGETHandler().handle(getEvent({ modelId: "not-a-valid-object-id" }));

    // THEN expect a 404 response
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
    // AND expect the repository to not be called at all
    expect(givenModelInfoRepositoryMock.getModelById).not.toHaveBeenCalled();
  });

  test("should respond with NOT_FOUND when the modelId is missing in the path", async () => {
    // GIVEN an event whose path does not contain a modelId
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelGETHandler().handle(getEvent({ modelId: null }));

    // THEN expect a 400 response with the INVALID_JSON_SCHEMA error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
    // AND expect the repository to not be called
    expect(givenModelInfoRepositoryMock.getModelById).not.toHaveBeenCalled();
  });

  test("should respond with INTERNAL_SERVER_ERROR when getHistory fails", async () => {
    // GIVEN a released model, so a non-manager gets past the visibility check
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: true };
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    // AND getHistory fails
    givenModelInfoRepositoryMock.getHistory.mockRejectedValue(new Error("DB failure"));
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelGETHandler().handle(getEvent());

    // THEN expect a 500 response with the DB_FAILED_TO_RETRIEVE_MODEL error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_MODEL
    );
  });

  test("should respond with OK when a model manager requests an unreleased model", async () => {
    // GIVEN the user is a model manager
    mockUserRole(true);
    // AND an unreleased model exists
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelGETHandler().handle(getEvent());

    // THEN expect an OK response containing the requested model
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body).id).toEqual(givenModelId);
  });

  test("should respond with NOT_FOUND when a non-manager requests an unreleased model", async () => {
    // GIVEN the user is not a model manager (default from beforeEach)
    // AND an unreleased model exists
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelGETHandler().handle(getEvent());

    // THEN expect a 404 response with the MODEL_NOT_FOUND_BY_ID error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
    // AND expect the history to not have been fetched
    expect(givenModelInfoRepositoryMock.getHistory).not.toHaveBeenCalled();
  });

  test("should respond with OK when a non-manager requests a released model", async () => {
    // GIVEN the user is not a model manager (default from beforeEach)
    // AND a released model exists
    const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: true };
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
    givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelGETHandler().handle(getEvent());

    // THEN expect an OK response containing the requested model
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body).id).toEqual(givenModelId);
  });

  test("should respond with INTERNAL_SERVER_ERROR when getModelById fails", async () => {
    // GIVEN getModelById fails
    const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
    givenModelInfoRepositoryMock.getModelById.mockRejectedValue(new Error("DB failure"));
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked
    const actualResponse = await new ModelGETHandler().handle(getEvent());

    // THEN expect a 500 response with the DB_FAILED_TO_RETRIEVE_MODEL error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_MODEL
    );
  });
});
