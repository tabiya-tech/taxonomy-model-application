import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import ErrorAPISpecs from "api-specifications/error";
import * as authenticatorModule from "auth/authorizer";
import * as responseModule from "./response";
import { OccupationGroupCreateController } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { IOccupationGroupService, OccupationGroupModelValidationError } from "../services/occupationGroup.service.type";
import { ModelForOccupationGroupValidationErrorCode } from "../_shared/OccupationGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
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

describe("OccupationGroupCreateController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  const postOccupationGroupHandler = async (event: APIGatewayProxyEvent) => {
    return new OccupationGroupCreateController().postOccupationGroup(event);
  };

  const postOccupationGroupSchemaInvalidHandler = async (event: APIGatewayProxyEvent) => {
    getMockGetSchema().mockReturnValue(jest.fn().mockReturnValue(false) as never);
    return new OccupationGroupCreateController().postOccupationGroup(event);
  };

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
        setParent: jest.fn(),
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

  test("should response with FORBIDDEN status code if a user is not a model manager", async () => {
    // GIVEN The user is a registered user (not a model manager)
    const givenRequestContext = usersRequestContext.REGISTED_USER;

    // AND checkRole return false
    checkRole.mockResolvedValue(false);

    // AND the even with the given request context
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
      requestContext: givenRequestContext,
    } as never;

    // WHEN the handler is invoked with the given event
    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(buildEvent(givenEvent));

    // THEN expect the handler to respond with the FORBIDDEN status
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

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
  test("POST should respond with the INTERNAL_SERVER_ERROR status code if the repository failed to create the occupationGroup", async () => {
    // GIVEN a valid request {method & header & payload}
    const givenModel: IModelInfo = {
      ...getIModelInfoMockData(1),
      UUID: "foo",
      UUIDHistory: ["foo"],
      released: false,
    };

    const givenPayload = {
      modelId: givenModel.id.toString(),
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "some random label",
      description: "some random description",
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
      path: `/models/${givenModel.id}/occupationGroups`,
    } as never;

    // AND User has the required role
    checkRole.mockResolvedValue(true);

    const givenOccupationGroupServiceMock = {
      create: jest.fn().mockRejectedValue(new Error("foo")),
      findById: jest.fn().mockResolvedValue(null),
      findParent: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      validateModelForOccupationGroup: jest.fn().mockResolvedValue({ isValid: true }),
      findChildren: jest.fn().mockResolvedValue([]),
      setParent: jest.fn(),
    } as IOccupationGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

    const givenModelInfoRepositoryMock = {
      Model: undefined as never,
      create: jest.fn().mockResolvedValue(null),
      getModelById: jest.fn().mockResolvedValue(givenModel),
      getModelByUUID: jest.fn().mockResolvedValue(null),
      getModels: jest.fn().mockResolvedValue([]),
      getHistory: jest.fn().mockResolvedValue([]),
      getModelsByIds: jest.fn(),
    } as IModelRepository;

    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockClear().mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the info handler is invoked with the given event
    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(givenEvent);

    // AND expect the handler to call the repository with the given payload
    expect(getServiceRegistry().occupationGroup.create).toHaveBeenCalledWith({ ...givenPayload });
    // AND to respond with the INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: OccupationGroupAPISpecs.POST.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
      message: "Failed to create the occupation group in the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("POST should respond with the MALFORMED_BODY status code if the repository failed to parse the request body of the occupationGroup", async () => {
    // GIVEN a valid request {method & header & payload}
    const givenModelId = getMockStringId(1);

    const givenPayload = {
      modelId: givenModelId.toString(),
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "some random label",
      description: "some random description",
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
      path: `/models/${givenModelId}/occupationGroups`,
    } as never;

    // AND User has the required role
    checkRole.mockResolvedValue(true);
    // mock the JSON.parse to throw an error
    jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
      throw new Error("Failed to parse JSON");
    });
    // WHEN the info handler is invoked with the given event
    const givenOccupationGroupServiceMock = {
      create: jest.fn().mockRejectedValue(new Error("foo")),
      findById: jest.fn().mockResolvedValue(null),
      findParent: jest.fn().mockResolvedValue(null),
      findChildren: jest.fn().mockResolvedValue([]),
      findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      validateModelForOccupationGroup: jest.fn().mockResolvedValue({ isValid: true }),
      setParent: jest.fn(),
    } as IOccupationGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

    const givenModelInfoRepositoryMock = {
      Model: undefined as never,
      create: jest.fn().mockResolvedValue(null),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null),
      getModels: jest.fn().mockResolvedValue([]),
      getHistory: jest.fn().mockResolvedValue([]),
      getModelsByIds: jest.fn(),
    };

    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockClear().mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the info handler is invoked with the given event
    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(givenEvent);

    // AND to respond with the BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY,
      message: ErrorAPISpecs.Constants.ReasonPhrases.MALFORMED_BODY,
      details: "Failed to parse JSON",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
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
      .mockRejectedValue(
        new OccupationGroupModelValidationError(ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
      );

    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(buildEvent(payload));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
  });
  test("POST should respond with the BAD_REQUEST status code if the model of the modelId provided is released", async () => {
    // GIVEN a valid request {method & header & payload}
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
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "some random label",
      description: "some random description",
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
      path: `/models/${givenModel.id}/occupationGroups`,
    } as never;

    // AND User has the required role
    checkRole.mockResolvedValue(true);

    const givenModelInfoRepositoryMock = {
      Model: undefined as never,
      create: jest.fn().mockResolvedValue(null),
      getModelById: jest.fn().mockResolvedValue(givenModel),
      getModelByUUID: jest.fn().mockResolvedValue(null),
      getModels: jest.fn().mockResolvedValue([]),
      getHistory: jest.fn().mockResolvedValue([]),
      getModelsByIds: jest.fn(),
    };

    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockClear().mockReturnValue(givenModelInfoRepositoryMock);

    const givenOccupationGroupServiceMock = {
      create: jest
        .fn()
        .mockRejectedValue(
          new OccupationGroupModelValidationError(ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED)
        ),
      findById: jest.fn().mockResolvedValue(null),
      findParent: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      validateModelForOccupationGroup: jest.fn().mockResolvedValue({ isValid: true }),
      findChildren: jest.fn().mockResolvedValue([]),
      setParent: jest.fn(),
    } as IOccupationGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

    // WHEN the info handler is invoked with the given event
    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(givenEvent);

    // THEN expect the handler to call the repository with the given payload
    expect(getServiceRegistry().occupationGroup.create).toHaveBeenCalledWith({ ...givenPayload });
    // AND to respond with the BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: OccupationGroupAPISpecs.POST.Enums.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
      message: "Model is released and cannot be modified",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });
  test("POST should respond with the BAD_REQUEST status code if modelId in payload does not match modelId in path", async () => {
    // GIVEN a valid request with mismatched modelIds
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    const givenModelIdInPath = getMockStringId(1);
    const givenModelIdInPayload = getMockStringId(2);
    const givenPayload = {
      modelId: givenModelIdInPayload.toString(),
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "some random label",
      description: "some random description",
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
      path: `/models/${givenModelIdInPath}/occupationGroups`,
    } as never;

    // AND User has the required role
    checkRole.mockResolvedValue(true);

    // WHEN the info handler is invoked with the given event
    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(givenEvent);

    // THEN expect the handler to respond with the BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: OccupationGroupAPISpecs.POST.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
      message: "modelId in payload does not match modelId in path",
      details: `Payload modelId: ${givenModelIdInPayload}, Path modelId: ${givenModelIdInPath}`,
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });
  test("POST should respond with the BAD_REQUEST status code if modelId is missing in the path", async () => {
    // GIVEN a valid request with missing modelId in path
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    const givenModelIdInPayload = getMockStringId(1);
    const givenPayload = {
      modelId: givenModelIdInPayload.toString(),
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "some random label",
      description: "some random description",
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

    // AND User has the required role
    checkRole.mockResolvedValue(true);

    // WHEN the info handler is invoked with the given event
    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(givenEvent);

    // THEN expect the handler to respond with the BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: OccupationGroupAPISpecs.POST.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
      message: "modelId is missing in the path",
      details: expect.stringContaining('"path":"/invalid/path/without/modelId"'),
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  testUnsupportedMediaType(postOccupationGroupHandler);
  testRequestJSONSchema(postOccupationGroupSchemaInvalidHandler);
  testRequestJSONMalformed(postOccupationGroupHandler);
  testTooLargePayload(
    HTTP_VERBS.POST,
    OccupationGroupAPISpecs.POST.Constants.MAX_POST_PAYLOAD_LENGTH,
    postOccupationGroupHandler
  );
  test("POST should return FORBIDDEN status code if the user does not have the required role", async () => {
    // GIVEN a valid request (method & header & payload)
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    const givenModelId = getMockStringId(1);

    const givenPayload = {
      modelId: givenModelId,
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "some random label",
      description: "some random description",
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

    // AND the user does not have the required role
    checkRole.mockResolvedValue(false);

    // WHEN the occupationGroup handler is invoked with the given event
    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(givenEvent);

    // THEN expect the handler to return the FORBIDDEN status
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
      path: `/models/${givenModelId}/occupationGroups`,
    } as never;
    checkRole.mockResolvedValue(true);
    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("POST should respond with INTERNAL_SERVER_ERROR when failed to fetch model detail from DB", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    const givenModelId = getMockStringId(1);
    const givenPayload = {
      modelId: givenModelId.toString(),
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "some random label",
      description: "some random description",
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
      path: `/models/${givenModelId}/occupationGroups`,
    } as never;
    checkRole.mockResolvedValue(true);
    const givenOccupationGroupServiceMock = {
      create: jest
        .fn()
        .mockRejectedValue(
          new OccupationGroupModelValidationError(ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB)
        ),
      findById: jest.fn().mockResolvedValue(null),
      findParent: jest.fn().mockRejectedValue(null),
      findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      validateModelForOccupationGroup: jest.fn().mockResolvedValue({ isValid: true }),
      findChildren: jest.fn().mockResolvedValue([]),
      setParent: jest.fn(),
    } as IOccupationGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: OccupationGroupAPISpecs.POST.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
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
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "some random label",
      description: "some random description",
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
      path: `/models/${givenModelId}/occupationGroups`,
    } as never;
    const givenOccupationGroupServiceMock = {
      create: jest
        .fn()
        .mockRejectedValue(new OccupationGroupModelValidationError(3 as ModelForOccupationGroupValidationErrorCode)),
      findById: jest.fn().mockResolvedValue(null),
      findParent: jest.fn().mockRejectedValue(null),
      findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      validateModelForOccupationGroup: jest.fn().mockResolvedValue({ isValid: true }),
      findChildren: jest.fn().mockResolvedValue([]),
      setParent: jest.fn(),
    } as IOccupationGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

    const controller = new OccupationGroupCreateController();
    const actualResponse = await controller.postOccupationGroup(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: OccupationGroupAPISpecs.POST.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
      message: "Failed to create the occupation group in the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });
});
