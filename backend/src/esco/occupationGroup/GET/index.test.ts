import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import * as authenticatorModule from "auth/authorizer";
import * as queryModule from "./query";
import * as responseModule from "./response";
import { OccupationGroupListController } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { IOccupationGroupService } from "../occupationGroupService.type";
import { ModelForOccupationGroupValidationErrorCode } from "../OccupationGroup.types";
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
const mockGetOccupationGroupsPathParameters = jest.mocked(queryModule.getOccupationGroupsPathParameters);
const mockTransformPaginated = jest.mocked(responseModule.transformPaginated);
const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

describe("OccupationGroupListController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    checkRole.mockResolvedValue(true);
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

  function buildEvent(path: string, queryStringParameters?: Record<string, string>) {
    return {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      path,
      pathParameters: { modelId: "model-1" },
      queryStringParameters: queryStringParameters || {},
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
  }

  test("returns a paginated list of occupation groups", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: "model-1" } as never);

    const paginatedResult = {
      items: [
        {
          id: "group-1",
          UUID: "uuid-1",
          UUIDHistory: ["uuid-1"],
          code: "123",
          originUri: "https://example.com/origin",
          preferredLabel: "Group label",
          altLabels: ["Alt label"],
          groupType: "ISCOGroup",
          description: "Description",
          parent: null,
          children: [],
          importId: "import-1",
          modelId: "model-1",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-02T00:00:00.000Z"),
        },
      ],
      nextCursor: null,
    };

    const transformed = { data: [{ id: "group-1" }], limit: 100, nextCursor: null };
    mockTransformPaginated.mockReturnValue(transformed as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.occupationGroup.findPaginated = jest.fn().mockResolvedValue(paginatedResult);

    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups(buildEvent("/models/model-1/occupationGroups"));

    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockTransformPaginated).toHaveBeenCalledWith(
      paginatedResult.items,
      "https://resources.example.com",
      100,
      null
    );
    expect(JSON.parse(actualResponse.body)).toEqual(transformed);
  });

  test("returns BAD_REQUEST when the query parameters fail validation", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(false);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: "model-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest.fn().mockResolvedValue(null);

    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups(
      buildEvent("/models/model-1/occupationGroups", { limit: "bad" })
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
    });
  });

  test("returns NOT_FOUND when the model does not exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValueOnce(validatePathFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: "model-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID);

    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups(buildEvent("/models/model-1/occupationGroups"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
  });
});
