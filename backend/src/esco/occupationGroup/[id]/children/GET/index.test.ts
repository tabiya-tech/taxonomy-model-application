import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import * as queryModule from "./query";
import * as responseModule from "./response";
import { handler as OccupationGroupChildrenHandler } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { IOccupationGroupService } from "../../../services/occupationGroup.service.type";
import { ModelForOccupationGroupValidationErrorCode } from "../../../_shared/OccupationGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";

jest.mock("server/serviceRegistry/serviceRegistry");
jest.mock("./query");
jest.mock("./response");
jest.mock("validator", () => ({
  ajvInstance: {
    getSchema: jest.fn(),
  },
}));

const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const mockGetOccupationGroupChildrenPathParameters = jest.mocked(queryModule.getOccupationGroupChildrenPathParameters);
const mockTransformPaginatedChildren = jest.mocked(responseModule.transformPaginatedChildren);

describe("OccupationGroupChildrenController", () => {
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
        validateModelForOccupationGroup: jest.fn(),
        findChildren: jest.fn(),
      } as IOccupationGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
    getResourcesBaseUrlSpy.mockReturnValue("https://resources.example.com");
  });

  function buildEvent(path: string): APIGatewayProxyEvent {
    return {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      path,
      pathParameters: {
        modelId: "model-1",
        id: "group-1",
      },
      queryStringParameters: {},
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
  }

  test("returns the children occupation groups when the model and children exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupChildrenPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);
    mockTransformPaginatedChildren.mockReturnValue({ data: [], limit: null, nextCursor: null } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.occupationGroup.findChildren = jest.fn().mockResolvedValue([]);

    const actualResponse = await OccupationGroupChildrenHandler(
      buildEvent("/models/model-1/occupationGroups/group-1/children")
    );

    expect(mockGetOccupationGroupChildrenPathParameters).toHaveBeenCalledWith(
      "/models/model-1/occupationGroups/group-1/children"
    );
    expect(mockServiceRegistry.occupationGroup.validateModelForOccupationGroup).toHaveBeenCalledWith("model-1");
    expect(mockServiceRegistry.occupationGroup.findChildren).toHaveBeenCalledWith("group-1");
    expect(mockTransformPaginatedChildren).toHaveBeenCalledWith([], "https://resources.example.com", null, null);
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("returns BAD_REQUEST when the route parameters fail validation", async () => {
    const validatePathFunction = Object.assign(jest.fn().mockReturnValue(false), {
      errors: [{ instancePath: "/id", message: "invalid id" }],
    });
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupChildrenPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const actualResponse = await OccupationGroupChildrenHandler(
      buildEvent("/models/model-1/occupationGroups/group-1/children")
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
    });
  });

  test("returns NOT_FOUND when the model does not exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupChildrenPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID);

    const actualResponse = await OccupationGroupChildrenHandler(
      buildEvent("/models/model-1/occupationGroups/group-1/children")
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Model not found",
    });
  });

  test("returns INTERNAL_SERVER_ERROR when validation against the model fails", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupChildrenPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB);

    const actualResponse = await OccupationGroupChildrenHandler(
      buildEvent("/models/model-1/occupationGroups/group-1/children")
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Failed to fetch the model details from the DB",
    });
  });
});
