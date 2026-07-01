import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import * as queryModule from "./query";
import * as responseModule from "./response";
import { OccupationGroupHistoryController } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { IOccupationGroupService } from "../../../services/occupationGroup.service.type";
import { ModelForOccupationGroupValidationErrorCode } from "../../../_shared/OccupationGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

jest.mock("server/serviceRegistry/serviceRegistry");
jest.mock("./query");
jest.mock("./response");
jest.mock("validator", () => ({
  ajvInstance: {
    getSchema: jest.fn(),
  },
}));

const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const mockGetOccupationGroupHistoryPathParameters = jest.mocked(queryModule.getOccupationGroupHistoryPathParameters);
const mockBuildHistoryResponse = jest.mocked(responseModule.buildHistoryResponse);

describe("OccupationGroupHistoryController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    const mockServiceRegistry = {
      occupationGroup: {
        create: jest.fn(),
        findById: jest.fn(),
        findParent: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupationGroup: jest.fn().mockResolvedValue(null),
        findChildren: jest.fn(),
        getHistory: jest.fn().mockResolvedValue([]),
      } as IOccupationGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
    getResourcesBaseUrlSpy.mockReturnValue("https://resources.example.com");
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupHistoryPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);
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

  const givenPath = "/models/model-1/occupationGroups/group-1/history";

  test("returns OK and the built history when the occupation group exists", async () => {
    const givenHistory = [{ model: { id: "model-1" }, modelHistoryDetails: [] }];
    mockBuildHistoryResponse.mockReturnValue([{ id: "model-1" }] as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.getHistory = jest.fn().mockResolvedValue(givenHistory);

    const controller = new OccupationGroupHistoryController();
    const actualResponse = await controller.getOccupationGroupHistory(buildEvent(givenPath));

    expect(mockGetOccupationGroupHistoryPathParameters).toHaveBeenCalledWith(givenPath);
    expect(mockServiceRegistry.occupationGroup.getHistory).toHaveBeenCalledWith("group-1");
    expect(mockBuildHistoryResponse).toHaveBeenCalledWith(givenHistory, "https://resources.example.com");
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("returns OK when the model is released (history includes released models)", async () => {
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED);
    mockServiceRegistry.occupationGroup.getHistory = jest.fn().mockResolvedValue([]);
    mockBuildHistoryResponse.mockReturnValue([] as never);

    const controller = new OccupationGroupHistoryController();
    const actualResponse = await controller.getOccupationGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockServiceRegistry.occupationGroup.getHistory).toHaveBeenCalledWith("group-1");
  });

  test("returns BAD_REQUEST when the route parameters fail validation", async () => {
    const validatePathFunction = Object.assign(jest.fn().mockReturnValue(false), {
      errors: [{ instancePath: "/id", message: "invalid id" }],
    });
    getMockGetSchema().mockReturnValue(validatePathFunction as never);

    const controller = new OccupationGroupHistoryController();
    const actualResponse = await controller.getOccupationGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
    });
  });

  test("returns NOT_FOUND when the occupation group is missing", async () => {
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.getHistory = jest.fn().mockResolvedValue(null);

    const controller = new OccupationGroupHistoryController();
    const actualResponse = await controller.getOccupationGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.History.GET.Enums.Response.Status404.ErrorCodes
          .OCCUPATION_GROUP_NOT_FOUND,
    });
  });

  test("returns NOT_FOUND when the model does not exist", async () => {
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID);

    const controller = new OccupationGroupHistoryController();
    const actualResponse = await controller.getOccupationGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({ message: "Model not found" });
  });

  test("returns INTERNAL_SERVER_ERROR when model validation fails to fetch from the DB", async () => {
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB);

    const controller = new OccupationGroupHistoryController();
    const actualResponse = await controller.getOccupationGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("returns INTERNAL_SERVER_ERROR when the service throws", async () => {
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.getHistory = jest.fn().mockRejectedValue(new Error("DB error"));

    const controller = new OccupationGroupHistoryController();
    const actualResponse = await controller.getOccupationGroupHistory(buildEvent(givenPath));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.History.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_HISTORY,
      message: "Failed to retrieve the occupation group history from the DB",
      details: "",
    });
  });
});
