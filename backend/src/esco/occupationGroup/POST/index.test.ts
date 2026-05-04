import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import ErrorAPISpecs from "api-specifications/error";
import * as authenticatorModule from "auth/authorizer";
import * as responseModule from "./response";
import { OccupationGroupCreateController } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { IOccupationGroupService, OccupationGroupModelValidationError } from "../occupationGroupService.type";
import { ModelForOccupationGroupValidationErrorCode } from "../OccupationGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";

jest.mock("server/serviceRegistry/serviceRegistry");
jest.mock("./response");
jest.mock("validator", () => ({
  ajvInstance: {
    getSchema: jest.fn(),
  },
}));

const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const mockTransform = jest.mocked(responseModule.transform);
const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

describe("OccupationGroupCreateController", () => {
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

  function buildEvent(body: unknown, path = "/models/model-1/occupationGroups"): APIGatewayProxyEvent {
    return {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1" },
      path,
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
  }

  test("creates an occupation group", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "123",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Label",
      description: "Description",
      altLabels: ["Alt"],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    const createdOccupationGroup = { id: "group-1", UUID: "uuid-1" };
    const transformed = { id: "group-1", created: true };
    mockTransform.mockReturnValue(transformed as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.create = jest.fn().mockResolvedValue(createdOccupationGroup);

    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(buildEvent(payload));

    expect(mockServiceRegistry.occupationGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: "model-1",
        code: "123",
      })
    );
    expect(mockTransform).toHaveBeenCalledWith(createdOccupationGroup, "https://resources.example.com");
    expect(actualResponse.statusCode).toBe(StatusCodes.CREATED);
    expect(JSON.parse(actualResponse.body)).toEqual(transformed);
  });

  test("returns BAD_REQUEST when the body is invalid JSON", async () => {
    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup({
      httpMethod: HTTP_VERBS.POST,
      body: "{",
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1" },
      path: "/models/model-1/occupationGroups",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never);

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY,
    });
  });

  test("returns NOT_FOUND when the model does not exist", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "123",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Label",
      description: "Description",
      altLabels: ["Alt"],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.create = jest
      .fn()
      .mockRejectedValue(new OccupationGroupModelValidationError(ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID));

    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(buildEvent(payload));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
  });
});
