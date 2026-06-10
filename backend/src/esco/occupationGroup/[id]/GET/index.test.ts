import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import * as queryModule from "./query";
import * as responseModule from "./response";
import { OccupationGroupDetailController } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { IOccupationGroupService } from "../../services/occupationGroup.service.type";
import { ModelForOccupationGroupValidationErrorCode } from "../../_shared/OccupationGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
import { getMockStringId } from "_test_utilities/mockMongoId";
import OccupationGroupDetailAPISpecs from "api-specifications/esco/occupationGroup/[id]";

jest.mock("server/serviceRegistry/serviceRegistry");
jest.mock("./query");
jest.mock("./response");

jest.mock("validator", () => ({
  ajvInstance: {
    getSchema: jest.fn(),
  },
}));

const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const mockGetOccupationGroupDetailPathParameters = jest.mocked(queryModule.getOccupationGroupDetailPathParameters);
const mockTransform = jest.mocked(responseModule.transform);

describe("OccupationGroupDetailController", () => {
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
        setParent: jest.fn(),
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

  test("returns the occupation group when the model and group exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const occupationGroup = {
      id: "group-1",
      UUID: "uuid-1",
      UUIDHistory: ["uuid-0", "uuid-1"],
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
    };

    const transformedOccupationGroup = {
      id: "group-1",
      marker: "transformed",
    };

    mockTransform.mockReturnValue(transformedOccupationGroup as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.occupationGroup.findById = jest.fn().mockResolvedValue(occupationGroup);

    const controller = new OccupationGroupDetailController();
    const actualResponse = await controller.getOccupationGroup(buildEvent("/models/model-1/occupationGroups/group-1"));

    expect(mockGetOccupationGroupDetailPathParameters).toHaveBeenCalledWith("/models/model-1/occupationGroups/group-1");
    expect(mockServiceRegistry.occupationGroup.validateModelForOccupationGroup).toHaveBeenCalledWith("model-1");
    expect(mockServiceRegistry.occupationGroup.findById).toHaveBeenCalledWith("group-1");
    expect(mockTransform).toHaveBeenCalledWith(occupationGroup, "https://resources.example.com");
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body)).toEqual(transformedOccupationGroup);
  });

  test("returns BAD_REQUEST when the route parameters fail validation", async () => {
    const validatePathFunction = Object.assign(jest.fn().mockReturnValue(false), {
      errors: [{ instancePath: "/id", message: "invalid id" }],
    });
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const controller = new OccupationGroupDetailController();
    const actualResponse = await controller.getOccupationGroup(buildEvent("/models/model-1/occupationGroups/group-1"));

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
    });
  });

  test("returns NOT_FOUND when the model does not exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID);

    const controller = new OccupationGroupDetailController();
    const actualResponse = await controller.getOccupationGroup(buildEvent("/models/model-1/occupationGroups/group-1"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Model not found",
    });
  });

  test("returns INTERNAL_SERVER_ERROR when validation against the model fails", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB);

    const controller = new OccupationGroupDetailController();
    const actualResponse = await controller.getOccupationGroup(buildEvent("/models/model-1/occupationGroups/group-1"));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Failed to fetch the model details from the DB",
    });
  });

  test("returns INTERNAL_SERVER_ERROR when fetching the occupation group from the DB fails", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.findById = jest.fn().mockResolvedValue(Promise.reject(new Error("DB error")));
    const controller = new OccupationGroupDetailController();
    const actualResponse = await controller.getOccupationGroup(buildEvent("/models/model-1/occupationGroups/group-1"));
    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupDetailAPISpecs.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_DETAIL,
      message: "Failed to retrieve the occupation group from the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("returns NOT_FOUND when the occupation group is missing", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.occupationGroup.findById = jest.fn().mockResolvedValue(null);

    const controller = new OccupationGroupDetailController();
    const actualResponse = await controller.getOccupationGroup(buildEvent("/models/model-1/occupationGroups/group-1"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Occupation group not found",
    });
  });
  test("GET /models/{modelId}/occupationGroups/{id} should response with BAD_REQUEST if the path validation failed ", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(false);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handler: any;

    jest.isolateModules(() => {
      ({ handler = handler } = require("./index"));
    });

    const givenModelId = getMockStringId(100);
    const givenOccupationGroupId = getMockStringId(100);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      pathParameters: { modelId: givenModelId.toString(), id: givenOccupationGroupId.toString() },
      queryStringParameters: {},
      path: `/models/${givenModelId}/occupationGroups/${givenOccupationGroupId}`,
    } as never;

    // WHEN the occupationGroup handler is invoked with the given event
    const actualResponse = await handler(givenEvent);

    // AND respond with the BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      details: expect.stringContaining("modelId"),
    };

    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
    });
    expect(typeof JSON.parse(actualResponse.body).details).toBe("string");
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });
});
