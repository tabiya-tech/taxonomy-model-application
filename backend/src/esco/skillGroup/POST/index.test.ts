import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import ErrorAPISpecs from "api-specifications/error";
import * as authenticatorModule from "auth/authorizer";
import * as responseModule from "./response";
import { SkillGroupCreateController, handler } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { ISkillGroupService, SkillGroupModelValidationError } from "../services/skillGroup.service.type";
import { ModelForSkillGroupValidationErrorCode } from "../_shared/skillGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import { randomUUID } from "node:crypto";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import {
  testRequestJSONMalformed,
  testRequestJSONSchema,
  testTooLargePayload,
  testUnsupportedMediaType,
} from "_test_utilities/stdRESTHandlerTests";

jest.mock("server/serviceRegistry/serviceRegistry");
jest.mock("./response");
jest.mock("validator", () => ({
  ajvInstance: {
    getSchema: jest.fn(),
  },
  ParseValidationError: jest.fn().mockReturnValue("validation error"),
}));

const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const mockTransform = jest.mocked(responseModule.transform);
const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

describe("SkillGroupCreateController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  const postSkillGroupHandler = async (event: APIGatewayProxyEvent) => {
    return new SkillGroupCreateController().postSkillGroup(event);
  };

  const postSkillGroupSchemaInvalidHandler = async (event: APIGatewayProxyEvent) => {
    getMockGetSchema().mockReturnValue(jest.fn().mockReturnValue(false) as never);
    return new SkillGroupCreateController().postSkillGroup(event);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    checkRole.mockResolvedValue(true);
    const mockServiceRegistry = {
      skillGroup: {
        create: jest.fn(),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForSkillGroup: jest.fn(),
        findParents: jest.fn(),
        findChildren: jest.fn(),
        getHistory: jest.fn(),
        setParent: jest.fn(),
      } as ISkillGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
    getResourcesBaseUrlSpy.mockReturnValue("https://resources.example.com");
  });

  function buildEvent(body: unknown, path = "/models/model-1/skillGroups"): APIGatewayProxyEvent {
    return {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1" },
      path,
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
  }

  test("should response with FORBIDDEN status code if a user is not a model manager", async () => {
    const givenRequestContext = usersRequestContext.REGISTED_USER;

    checkRole.mockResolvedValue(false);

    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
      requestContext: givenRequestContext,
    } as never;

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(buildEvent(givenEvent));

    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("creates a skill group", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "S1",
      preferredLabel: "Label",
      description: "Description",
      scopeNote: "ScopeNote",
      altLabels: ["Alt"],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    const createdSkillGroup = { id: "group-1", UUID: "uuid-1" };
    const transformed = { id: "group-1", created: true };
    mockTransform.mockReturnValue(transformed as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.create = jest.fn().mockResolvedValue(createdSkillGroup);

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(buildEvent(payload));

    expect(mockServiceRegistry.skillGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: "model-1",
        code: "S1",
      })
    );
    expect(mockTransform).toHaveBeenCalledWith(createdSkillGroup, "https://resources.example.com");
    expect(actualResponse.statusCode).toBe(StatusCodes.CREATED);
    expect(JSON.parse(actualResponse.body)).toEqual(transformed);
  });

  test("POST should respond with the INTERNAL_SERVER_ERROR status code if the repository failed to create the skillGroup", async () => {
    const givenModel: IModelInfo = {
      ...getIModelInfoMockData(1),
      UUID: "foo",
      UUIDHistory: ["foo"],
      released: false,
    };

    const givenPayload = {
      modelId: givenModel.id.toString(),
      code: getMockRandomSkillCode(),
      preferredLabel: "some random label",
      description: "some random description",
      scopeNote: "some random scopeNote",
      altLabels: ["some random alt label 1", "some random alt label 2"],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModel.id.toString() },
      path: `/models/${givenModel.id}/skillGroups`,
    } as never;

    checkRole.mockResolvedValue(true);

    const givenSkillGroupServiceMock = {
      create: jest.fn().mockRejectedValue(new Error("foo")),
      findById: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      validateModelForSkillGroup: jest.fn().mockResolvedValue({ isValid: true }),
      findParents: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      findChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      getHistory: jest.fn(),
      setParent: jest.fn(),
    } as ISkillGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

    const givenModelInfoRepositoryMock = {
      Model: undefined as never,
      create: jest.fn().mockResolvedValue(null),
      getModelById: jest.fn().mockResolvedValue(givenModel),
      getModelByUUID: jest.fn().mockResolvedValue(null),
      getModels: jest.fn().mockResolvedValue([]),
      getHistory: jest.fn().mockResolvedValue([]),
      getModelsByIds: jest.fn(),
      releaseModel: jest.fn(),
    } as IModelRepository;

    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockClear().mockReturnValue(givenModelInfoRepositoryMock);

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(givenEvent);

    expect(getServiceRegistry().skillGroup.create).toHaveBeenCalledWith({ ...givenPayload });
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: SkillGroupAPISpecs.POST.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP,
      message: "Failed to create the skill group in the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("POST should respond with the MALFORMED_BODY status code if the repository failed to parse the request body of the skillGroup", async () => {
    const givenModelId = getMockStringId(1);

    const givenPayload = {
      modelId: givenModelId.toString(),
      code: getMockRandomSkillCode(),
      preferredLabel: "some random label",
      description: "some random description",
      scopeNote: "some random scopeNote",
      altLabels: ["some random alt label 1", "some random alt label 2"],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelId.toString() },
      path: `/models/${givenModelId}/skillGroups`,
    } as never;

    checkRole.mockResolvedValue(true);
    jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
      throw new Error("Failed to parse JSON");
    });

    const givenSkillGroupServiceMock = {
      create: jest.fn().mockRejectedValue(new Error("foo")),
      findById: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      validateModelForSkillGroup: jest.fn().mockResolvedValue({ isValid: true }),
      findParents: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      findChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      getHistory: jest.fn(),
      setParent: jest.fn(),
    } as ISkillGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

    const givenModelInfoRepositoryMock = {
      Model: undefined as never,
      create: jest.fn().mockResolvedValue(null),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null),
      getModels: jest.fn().mockResolvedValue([]),
      getHistory: jest.fn().mockResolvedValue([]),
      getModelsByIds: jest.fn(),
      releaseModel: jest.fn(),
    };

    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockClear().mockReturnValue(givenModelInfoRepositoryMock);

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY,
      message: ErrorAPISpecs.Constants.ReasonPhrases.MALFORMED_BODY,
      details: "Failed to parse JSON",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("returns BAD_REQUEST when the body is invalid JSON", async () => {
    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup({
      httpMethod: HTTP_VERBS.POST,
      body: "{",
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1" },
      path: "/models/model-1/skillGroups",
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
      code: "S1",
      preferredLabel: "Label",
      description: "Description",
      scopeNote: "ScopeNote",
      altLabels: ["Alt"],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.create = jest
      .fn()
      .mockRejectedValue(
        new SkillGroupModelValidationError(ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
      );

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(buildEvent(payload));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  test("POST should respond with the BAD_REQUEST status code if the model of the modelId provided is released", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    const givenModel: IModelInfo = {
      ...getIModelInfoMockData(1),
      UUID: "foo",
      UUIDHistory: ["foo"],
      released: true,
    };
    const givenPayload = {
      modelId: givenModel.id.toString(),
      code: getMockRandomSkillCode(),
      preferredLabel: "some random label",
      description: "some random description",
      scopeNote: "some random scopeNote",
      altLabels: ["some random alt label 1", "some random alt label 2"],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModel.id.toString() },
      path: `/models/${givenModel.id}/skillGroups`,
    } as never;

    checkRole.mockResolvedValue(true);

    const givenModelInfoRepositoryMock = {
      Model: undefined as never,
      create: jest.fn().mockResolvedValue(null),
      getModelById: jest.fn().mockResolvedValue(givenModel),
      getModelByUUID: jest.fn().mockResolvedValue(null),
      getModels: jest.fn().mockResolvedValue([]),
      getHistory: jest.fn().mockResolvedValue([]),
      getModelsByIds: jest.fn(),
      releaseModel: jest.fn(),
    };

    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockClear().mockReturnValue(givenModelInfoRepositoryMock);

    const givenSkillGroupServiceMock = {
      create: jest
        .fn()
        .mockRejectedValue(new SkillGroupModelValidationError(ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED)),
      findById: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      validateModelForSkillGroup: jest.fn().mockResolvedValue({ isValid: true }),
      findParents: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      findChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      getHistory: jest.fn(),
      setParent: jest.fn(),
    } as ISkillGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(givenEvent);

    expect(getServiceRegistry().skillGroup.create).toHaveBeenCalledWith({ ...givenPayload });
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: SkillGroupAPISpecs.POST.Enums.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
      message: "Model is released and cannot be modified",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("POST should respond with the BAD_REQUEST status code if modelId in payload does not match modelId in path", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    const givenModelIdInPath = getMockStringId(1);
    const givenModelIdInPayload = getMockStringId(2);
    const givenPayload = {
      modelId: givenModelIdInPayload.toString(),
      code: getMockRandomSkillCode(),
      preferredLabel: "some random label",
      description: "some random description",
      scopeNote: "some random scopeNote",
      altLabels: ["some random alt label 1", "some random alt label 2"],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelIdInPath.toString() },
      path: `/models/${givenModelIdInPath}/skillGroups`,
    } as never;

    checkRole.mockResolvedValue(true);

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: SkillGroupAPISpecs.POST.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP,
      message: "modelId in payload does not match modelId in path",
      details: `Payload modelId: ${givenModelIdInPayload}, Path modelId: ${givenModelIdInPath}`,
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("POST should respond with the BAD_REQUEST status code if modelId is missing in the path", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    const givenModelIdInPayload = getMockStringId(1);
    const givenPayload = {
      modelId: givenModelIdInPayload.toString(),
      code: getMockRandomSkillCode(),
      preferredLabel: "some random label",
      description: "some random description",
      scopeNote: "some random scopeNote",
      altLabels: ["some random alt label 1", "some random alt label 2"],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: {},
      path: "/invalid/path/without/modelId",
    } as never;

    checkRole.mockResolvedValue(true);

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: SkillGroupAPISpecs.POST.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP,
      message: "modelId is missing in the path",
      details: expect.stringContaining('"path":"/invalid/path/without/modelId"'),
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  testUnsupportedMediaType(postSkillGroupHandler);
  testRequestJSONSchema(postSkillGroupSchemaInvalidHandler);
  testRequestJSONMalformed(postSkillGroupHandler);
  testTooLargePayload(HTTP_VERBS.POST, SkillGroupAPISpecs.POST.Constants.MAX_PAYLOAD_LENGTH, postSkillGroupHandler);

  test("POST should return FORBIDDEN status code if the user does not have the required role", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    const givenModelId = getMockStringId(1);

    const givenPayload = {
      modelId: givenModelId,
      code: getMockRandomSkillCode(),
      preferredLabel: "some random label",
      description: "some random description",
      scopeNote: "some random scopeNote",
      altLabels: ["some random alt label 1", "some random alt label 2"],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
    } as never;

    checkRole.mockResolvedValue(false);

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("POST should return BAD_REQUEST when body is null", async () => {
    const validateFunction = jest.fn().mockReturnValue(false);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const givenModelId = getMockStringId(1);
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: null,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelId.toString() },
      path: `/models/${givenModelId}/skillGroups`,
    } as never;
    checkRole.mockResolvedValue(true);
    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("POST should respond with INTERNAL_SERVER_ERROR when failed to fetch model detail from DB", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    const givenModelId = getMockStringId(1);
    const givenPayload = {
      modelId: givenModelId.toString(),
      code: getMockRandomSkillCode(),
      preferredLabel: "some random label",
      description: "some random description",
      scopeNote: "some random scopeNote",
      altLabels: ["some random alt label 1", "some random alt label 2"],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelId.toString() },
      path: `/models/${givenModelId}/skillGroups`,
    } as never;
    checkRole.mockResolvedValue(true);
    const givenSkillGroupServiceMock = {
      create: jest
        .fn()
        .mockRejectedValue(
          new SkillGroupModelValidationError(ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB)
        ),
      findById: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      validateModelForSkillGroup: jest.fn().mockResolvedValue({ isValid: true }),
      findParents: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      findChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      getHistory: jest.fn(),
      setParent: jest.fn(),
    } as ISkillGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: SkillGroupAPISpecs.POST.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP,
      message: "Failed to fetch the model detail from the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("POST should respond with INTERNAL_SERVER_ERROR for unknown validation error code", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    const givenModelId = getMockStringId(1);
    const givenPayload = {
      modelId: givenModelId.toString(),
      code: getMockRandomSkillCode(),
      preferredLabel: "some random label",
      description: "some random description",
      scopeNote: "some random scopeNote",
      altLabels: ["some random alt label 1", "some random alt label 2"],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelId.toString() },
      path: `/models/${givenModelId}/skillGroups`,
    } as never;
    const givenSkillGroupServiceMock = {
      create: jest
        .fn()
        .mockRejectedValue(new SkillGroupModelValidationError(3 as ModelForSkillGroupValidationErrorCode)),
      findById: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      validateModelForSkillGroup: jest.fn().mockResolvedValue({ isValid: true }),
      findParents: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      findChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      getHistory: jest.fn(),
      setParent: jest.fn(),
    } as ISkillGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

    const controller = new SkillGroupCreateController();
    const actualResponse = await controller.postSkillGroup(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: SkillGroupAPISpecs.POST.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP,
      message: "Failed to create the skill group in the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("handler should delegate to SkillGroupCreateController.postSkillGroup", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    jest.requireMock("validator").ajvInstance.getSchema.mockReturnValue(validateFunction as never);

    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify({
        modelId: "model-1",
        code: "S1",
        preferredLabel: "Label",
        description: "Description",
        scopeNote: "ScopeNote",
        altLabels: ["Alt"],
        originUri: "https://example.com",
        UUIDHistory: ["uuid-1"],
      }),
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1" },
      path: "/models/model-1/skillGroups",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;

    const actualResponse = await handler(givenEvent);
    expect(actualResponse.statusCode).toBe(StatusCodes.CREATED);
  });
});
