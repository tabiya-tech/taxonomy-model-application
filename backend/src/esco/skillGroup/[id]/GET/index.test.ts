import "_test_utilities/consoleMock";
import { APIGatewayProxyEvent } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import * as queryModule from "./query";
import * as responseModule from "./response";
import { SkillGroupDetailController } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { ISkillGroupService } from "../../services/skillGroup.service.type";
import { ModelForSkillGroupValidationErrorCode } from "../../_shared/skillGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getISkillGroupMockData } from "../../_shared/testDataHelper";
import { randomUUID } from "node:crypto";
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
const mockGetSkillGroupDetailPathParameters = jest.mocked(queryModule.getSkillGroupDetailPathParameters);
const mockTransform = jest.mocked(responseModule.transform);

describe("SkillGroupDetailController", () => {
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
        validateModelForSkillGroup: jest.fn(),
        findChildren: jest.fn(),
        getHistory: jest.fn(),
        setParent: jest.fn(),
        create: jest.fn(),
      } as ISkillGroupService,
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
  test("returns the skill group when the model and group exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetSkillGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);
    const givenModelId = getMockStringId(1);

    const skillGroup = {
      ...getISkillGroupMockData(1, givenModelId),
      UUID: "foo",
      UUIDHistory: ["foo"],
      importId: randomUUID(),
    };

    const transformedSkillGroup = {
      id: "group-1",
      marker: "transformed",
    };

    mockTransform.mockReturnValue(transformedSkillGroup as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue(skillGroup);

    const controller = new SkillGroupDetailController();
    const actualResponse = await controller.getSkillGroup(buildEvent("/models/model-1/skillGroups/group-1"));

    expect(mockGetSkillGroupDetailPathParameters).toHaveBeenCalledWith("/models/model-1/skillGroups/group-1");
    expect(mockServiceRegistry.skillGroup.validateModelForSkillGroup).toHaveBeenCalledWith("model-1");
    expect(mockServiceRegistry.skillGroup.findById).toHaveBeenCalledWith("group-1");
    expect(mockTransform).toHaveBeenCalledWith(skillGroup, "https://resources.example.com");
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body)).toEqual(transformedSkillGroup);
  });
  test("GET skillGroup Detail returns BAD_REQUEST when the route parameters fail validation", async () => {
    const validatePathFunction = Object.assign(jest.fn().mockReturnValue(false), {
      errors: [{ instancePath: "/id", message: "invalid id" }],
    });
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetSkillGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const controller = new SkillGroupDetailController();
    const actualResponse = await controller.getSkillGroup(buildEvent("/models/model-1/skillGroups/group-1"));

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
    });
  });
  test("GET skillGroup Detail returns NOT_FOUND when the model does not exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetSkillGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue(ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID);

    const controller = new SkillGroupDetailController();
    const actualResponse = await controller.getSkillGroup(buildEvent("/models/model-1/skillGroups/group-1"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Model not found",
    });
  });
  test("GET skillGroup Detail returns INTERNAL_SERVER_ERROR when validation against the model fails", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetSkillGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue(ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB);

    const controller = new SkillGroupDetailController();
    const actualResponse = await controller.getSkillGroup(buildEvent("/models/model-1/skillGroups/group-1"));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Failed to fetch the model details from the DB",
    });
  });
  test("GET skillGroup returns INTERNAL_SERVER_ERROR when fetching the skill group from the DB fails", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetSkillGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue(Promise.reject(new Error("DB error")));
    const controller = new SkillGroupDetailController();
    const actualResponse = await controller.getSkillGroup(buildEvent("/models/model-1/skillGroups/group-1"));
    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
      message: "Failed to retrieve the skill group from the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });
  test("GET skillGroup returns INTERNAL_SERVER_ERROR when the repository throws a non-Error value", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetSkillGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.skillGroup.findById = jest.fn().mockRejectedValue("repository failed");

    const controller = new SkillGroupDetailController();
    const actualResponse = await controller.getSkillGroup(buildEvent("/models/model-1/skillGroups/group-1"));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
      message: "Failed to retrieve the skill group from the DB",
      details: "",
    });
  });
  test("GET skillGroup returns NOT_FOUND when the skill group is missing", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetSkillGroupDetailPathParameters.mockReturnValue({
      modelId: "model-1",
      id: "group-1",
    } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue(null);

    const controller = new SkillGroupDetailController();
    const actualResponse = await controller.getSkillGroup(buildEvent("/models/model-1/skillGroups/group-1"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "skill group not found",
    });
  });
  test("GET /models/{modelId}/skillGroups/{id} should response with BAD_REQUEST if the path validation failed ", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(false);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handler: any;

    jest.isolateModules(() => {
      ({ handler = handler } = require("./index"));
    });

    const givenModelId = getMockStringId(100);
    const givenSkillGroupId = getMockStringId(100);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
      queryStringParameters: {},
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}`,
    } as never;

    // WHEN the skillGroup handler is invoked with the given event
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
