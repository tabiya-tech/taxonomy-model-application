import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import * as queryModule from "./query";
import * as responseModule from "./response";
import { SkillGroupHistoryController } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { ISkillGroupService } from "esco/skillGroup/services/skillGroup.service.type";
import { ModelForSkillGroupValidationErrorCode } from "esco/skillGroup/_shared/skillGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";

jest.mock("server/serviceRegistry/serviceRegistry");
jest.mock("./query");
jest.mock("./response");
jest.mock("validator", () => ({
  ajvInstance: {
    getSchema: jest.fn(),
  },
}));

const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const mockGetSkillGroupHistoryPathParameters = jest.mocked(queryModule.getSkillGroupHistoryPathParameters);
const mockBuildHistoryResponse = jest.mocked(responseModule.buildHistoryResponse);

describe("SkillGroupHistoryController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    const mockServiceRegistry = {
      skillGroup: {
        findById: jest.fn(),
        findParents: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForSkillGroup: jest.fn().mockResolvedValue(null),
        findChildren: jest.fn(),
        getHistory: jest.fn().mockResolvedValue([]),
        setParent: jest.fn(),
        create: jest.fn(),
      } as ISkillGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
    getResourcesBaseUrlSpy.mockReturnValue("https://resources.example.com");
    getMockGetSchema().mockReturnValue(jest.fn().mockReturnValue(true) as never);
    mockGetSkillGroupHistoryPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);
  });

  function buildEvent(path: string): APIGatewayProxyEvent {
    return {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      path,
      pathParameters: { modelId: "model-1", id: "group-1" },
      queryStringParameters: {},
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
  }

  const givenPath = "/models/model-1/skillGroups/group-1/history";

  test("returns OK and the built history when the skill group exists", async () => {
    const givenHistory = [{ entity: { id: "group-1" }, model: { id: "model-1" } }];
    mockBuildHistoryResponse.mockReturnValue([{ id: "group-1", model: { id: "model-1" } }] as never);
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.getHistory = jest.fn().mockResolvedValue(givenHistory);

    const controller = new SkillGroupHistoryController();
    const actualResponse = await controller.getSkillGroupHistory(buildEvent(givenPath));

    expect(mockGetSkillGroupHistoryPathParameters).toHaveBeenCalledWith(givenPath);
    expect(mockServiceRegistry.skillGroup.getHistory).toHaveBeenCalledWith("group-1");
    expect(mockBuildHistoryResponse).toHaveBeenCalledWith(givenHistory);
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("returns OK when the model is released (history includes released models)", async () => {
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue(ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED);
    mockServiceRegistry.skillGroup.getHistory = jest.fn().mockResolvedValue([]);
    mockBuildHistoryResponse.mockReturnValue([] as never);

    const controller = new SkillGroupHistoryController();
    const actualResponse = await controller.getSkillGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockServiceRegistry.skillGroup.getHistory).toHaveBeenCalledWith("group-1");
  });

  test("returns BAD_REQUEST when the route parameters fail validation", async () => {
    getMockGetSchema().mockReturnValue(
      Object.assign(jest.fn().mockReturnValue(false), {
        errors: [{ instancePath: "/id", message: "invalid" }],
      }) as never
    );

    const controller = new SkillGroupHistoryController();
    const actualResponse = await controller.getSkillGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
    });
  });

  test("returns NOT_FOUND when the skill group is missing", async () => {
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.getHistory = jest.fn().mockResolvedValue(null);

    const controller = new SkillGroupHistoryController();
    const actualResponse = await controller.getSkillGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: SkillGroupAPISpecs.SkillGroup.History.GET.Enums.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
    });
  });

  test("returns NOT_FOUND when the model does not exist", async () => {
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue(ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID);

    const controller = new SkillGroupHistoryController();
    const actualResponse = await controller.getSkillGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({ message: "Model not found" });
  });

  test("returns INTERNAL_SERVER_ERROR when model validation fails to fetch from the DB", async () => {
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue(ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB);

    const controller = new SkillGroupHistoryController();
    const actualResponse = await controller.getSkillGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("returns INTERNAL_SERVER_ERROR when the service throws", async () => {
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.getHistory = jest.fn().mockRejectedValue(new Error("DB error"));

    const controller = new SkillGroupHistoryController();
    const actualResponse = await controller.getSkillGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode:
        SkillGroupAPISpecs.SkillGroup.History.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_SKILL_GROUP_HISTORY,
      message: "Failed to retrieve the skill group history from the DB",
      details: "",
    });
  });
});
