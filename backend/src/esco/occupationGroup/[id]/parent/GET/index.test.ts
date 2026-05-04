import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import * as queryModule from "./query";
import * as responseModule from "./response";
import { OccupationGroupParentController } from "./index";
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
const mockGetOccupationGroupParentPathParameters = jest.mocked(queryModule.getOccupationGroupParentPathParameters);
const mockTransformParent = jest.mocked(responseModule.transformParent);

describe("OccupationGroupParentController", () => {
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

  test("returns the parent occupation group when the model and parent exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupParentPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);
    mockTransformParent.mockReturnValue({ id: "parent-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.occupationGroup.findParent = jest.fn().mockResolvedValue({ id: "parent-1" });

    const controller = new OccupationGroupParentController();
    const actualResponse = await controller.getParentOccupationGroup(buildEvent("/models/model-1/occupationGroups/group-1/parent"));

    expect(mockGetOccupationGroupParentPathParameters).toHaveBeenCalledWith(
      "/models/model-1/occupationGroups/group-1/parent"
    );
    expect(mockServiceRegistry.occupationGroup.validateModelForOccupationGroup).toHaveBeenCalledWith("model-1");
    expect(mockServiceRegistry.occupationGroup.findParent).toHaveBeenCalledWith("group-1");
    expect(mockTransformParent).toHaveBeenCalledWith({ id: "parent-1" }, "https://resources.example.com");
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("returns BAD_REQUEST when the route parameters fail validation", async () => {
    const validatePathFunction = Object.assign(jest.fn().mockReturnValue(false), {
      errors: [{ instancePath: "/id", message: "invalid id" }],
    });
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupParentPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const controller = new OccupationGroupParentController();
    const actualResponse = await controller.getParentOccupationGroup(buildEvent("/models/model-1/occupationGroups/group-1/parent"));

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
    });
  });

  test("returns NOT_FOUND when the parent occupation group is missing", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupParentPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.occupationGroup.findParent = jest.fn().mockResolvedValue(null);

    const controller = new OccupationGroupParentController();
    const actualResponse = await controller.getParentOccupationGroup(buildEvent("/models/model-1/occupationGroups/group-1/parent"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Occupation group or parent not found",
    });
  });

  test("returns INTERNAL_SERVER_ERROR when validation against the model fails", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupParentPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB);

    const controller = new OccupationGroupParentController();
    const actualResponse = await controller.getParentOccupationGroup(buildEvent("/models/model-1/occupationGroups/group-1/parent"));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Failed to fetch the model details from the DB",
    });
  });
});
