import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import ErrorAPISpecs from "api-specifications/error";
import * as authenticatorModule from "auth/authorizer";
import * as responseModule from "./response";
import { OccupationGroupPUTController, handler as exportedHandler } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import {
  IOccupationGroupService,
  OccupationGroupModelValidationError,
} from "../../services/occupationGroup.service.type";
import { ModelForOccupationGroupValidationErrorCode } from "../../_shared/OccupationGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
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
const mockBuildPUTResponse = jest.mocked(responseModule.buildPUTResponse);
const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

describe("OccupationGroupPUTController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  const putHandler = async (event: APIGatewayProxyEvent) => {
    return new OccupationGroupPUTController().put(event);
  };

  const putSchemaInvalidHandler = async (event: APIGatewayProxyEvent) => {
    getMockGetSchema().mockReturnValue(jest.fn().mockReturnValue(false) as never);
    return new OccupationGroupPUTController().put(event);
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
        searchPaginated: jest.fn(),
        validateModelForOccupationGroup: jest.fn(),
        findChildren: jest.fn(),
        getHistory: jest.fn(),
        setParent: jest.fn(),
        update: jest.fn(),
        patch: jest.fn(),
      } as IOccupationGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
    getResourcesBaseUrlSpy.mockReturnValue("https://resources.example.com");
  });

  function buildEvent(body: unknown, path = "/models/model-1/occupationGroups/group-1"): APIGatewayProxyEvent {
    return {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path,
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
  }

  test("should respond with FORBIDDEN status code if a user is not a model manager", async () => {
    // GIVEN a registered user (not a model manager)
    checkRole.mockResolvedValue(false);
    const givenEvent = buildEvent({});

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(givenEvent);

    // THEN expect FORBIDDEN status
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("should update an occupation group and return the transformed response", async () => {
    // GIVEN a valid PUT request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Updated Label",
      description: "Updated description",
      altLabels: ["alt-1"],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    // AND the service returns an updated occupation group
    const updatedOccupationGroup = { id: "group-1", UUID: "uuid-1" };
    const transformed = { id: "group-1", updated: true };
    mockBuildPUTResponse.mockReturnValue(transformed as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.update = jest.fn().mockResolvedValue(updatedOccupationGroup);

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(buildEvent(payload));

    // THEN expect the service to be called with the parsed spec
    expect(mockServiceRegistry.occupationGroup.update).toHaveBeenCalledWith(
      "group-1",
      "model-1",
      expect.objectContaining({
        modelId: "model-1",
        code: "1234",
      })
    );
    // AND expect the response to be built from the updated group
    expect(mockBuildPUTResponse).toHaveBeenCalledWith(updatedOccupationGroup, "https://resources.example.com");
    // AND expect status OK
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body)).toEqual(transformed);
  });

  test("should respond with NOT_FOUND if the occupation group does not exist", async () => {
    // GIVEN a valid PUT request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Label",
      description: "Desc",
      altLabels: [],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    // AND the service returns null (not found)
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.update = jest.fn().mockResolvedValue(null);

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(buildEvent(payload));

    // THEN expect NOT_FOUND status
    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status404.ErrorCodes.OCCUPATION_GROUP_NOT_FOUND,
      message: "Occupation group not found",
      details: "No occupation group found with id: group-1",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with BAD_REQUEST if modelId in payload does not match modelId in path", async () => {
    // GIVEN a valid request with mismatched modelIds
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-2",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Label",
      description: "Desc",
      altLabels: [],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(givenEvent);

    // THEN expect BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status400.ErrorCodes.INVALID_MODEL_ID,
      message: "modelId in payload does not match modelId in path",
      details: "Payload modelId: model-2, Path modelId: model-1",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with NOT_FOUND when the model does not exist", async () => {
    // GIVEN a valid PUT request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Label",
      description: "Desc",
      altLabels: [],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    // AND the service throws MODEL_NOT_FOUND error
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.update = jest
      .fn()
      .mockRejectedValue(
        new OccupationGroupModelValidationError(ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
      );

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(buildEvent(payload));

    // THEN expect NOT_FOUND status
    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
      message: "Model not found by the provided ID",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with BAD_REQUEST when the model is released", async () => {
    // GIVEN a valid PUT request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Label",
      description: "Desc",
      altLabels: [],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    // AND the service throws MODEL_IS_RELEASED error
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.update = jest
      .fn()
      .mockRejectedValue(
        new OccupationGroupModelValidationError(ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED)
      );

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(buildEvent(payload));

    // THEN expect BAD_REQUEST status
    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
      message: "Cannot update occupation groups in a released model",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with INTERNAL_SERVER_ERROR when failed to fetch model from DB", async () => {
    // GIVEN a valid PUT request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Label",
      description: "Desc",
      altLabels: [],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    // AND the service throws FAILED_TO_FETCH_FROM_DB error
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.update = jest
      .fn()
      .mockRejectedValue(
        new OccupationGroupModelValidationError(ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB)
      );

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(buildEvent(payload));

    // THEN expect INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status500.ErrorCodes
          .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
      message: "Failed to fetch the model details from the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with INTERNAL_SERVER_ERROR for unknown validation error code", async () => {
    // GIVEN a valid PUT request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Label",
      description: "Desc",
      altLabels: [],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    // AND the service throws an unknown validation error
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.update = jest
      .fn()
      .mockRejectedValue(new OccupationGroupModelValidationError(999 as ModelForOccupationGroupValidationErrorCode));

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(buildEvent(payload));

    // THEN expect INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status500.ErrorCodes
          .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
      message: "Failed to update the occupation group in the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with INTERNAL_SERVER_ERROR when service.update throws a generic error", async () => {
    // GIVEN a valid PUT request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Label",
      description: "Desc",
      altLabels: [],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    // AND the service throws a generic error
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.update = jest.fn().mockRejectedValue(new Error("Generic error"));

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(buildEvent(payload));

    // THEN expect INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status500.ErrorCodes
          .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
      message: "Failed to update the occupation group in the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("PUT should return BAD_REQUEST when body is null", async () => {
    const validateFunction = jest.fn().mockReturnValue(false);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: null,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
    checkRole.mockResolvedValue(true);
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should update an occupation group with LocalGroup groupType", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.LocalGroup,
      preferredLabel: "Local Group Label",
      description: "Desc",
      altLabels: [],
      originUri: "https://example.com",
      UUIDHistory: [],
    };
    const updatedOccupationGroup = { id: "group-1" };
    mockBuildPUTResponse.mockReturnValue({ id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.update = jest.fn().mockResolvedValue(updatedOccupationGroup);

    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(buildEvent(payload));
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("should respond with BAD_REQUEST when the path parameters are invalid", async () => {
    // GIVEN a request with a path that does not match the expected route pattern
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify({
        modelId: "model-1",
        code: "1234",
        groupType: "ISCOGroup",
        preferredLabel: "Label",
        description: "Desc",
        altLabels: [],
        originUri: "https://example.com",
        UUIDHistory: [],
      }),
      headers: { "Content-Type": "application/json" },
      pathParameters: {},
      path: "/invalid/path",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
    checkRole.mockResolvedValue(true);

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(givenEvent);

    // THEN expect BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return the response from the exported handler", async () => {
    // GIVEN a valid PUT request event
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Updated Label",
      description: "Updated description",
      altLabels: ["alt-1"],
      originUri: "https://example.com",
      UUIDHistory: ["uuid-1"],
    };
    const updatedOccupationGroup = { id: "group-1", UUID: "uuid-1" };
    mockBuildPUTResponse.mockReturnValue({ id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.update = jest.fn().mockResolvedValue(updatedOccupationGroup);

    // WHEN calling the exported handler
    const event = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
    const actualResponse = await exportedHandler(event);

    // THEN expect status OK
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("should handle AJV schema not found for request payload", async () => {
    // GIVEN the AJV schema is not available
    getMockGetSchema().mockReturnValue(undefined);
    checkRole.mockResolvedValue(true);

    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify({ modelId: "model-1" }),
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;

    // WHEN the handler is invoked
    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(givenEvent);

    // THEN expect INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should accept lowercase content-type header in request", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      code: "1234",
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "Label",
      description: "Desc",
      altLabels: [],
      originUri: "https://example.com",
      UUIDHistory: [],
    };
    const updatedOccupationGroup = { id: "group-1" };
    mockBuildPUTResponse.mockReturnValue({ id: "group-1" } as never);
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.update = jest.fn().mockResolvedValue(updatedOccupationGroup);

    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;

    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(givenEvent);
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("should return MALFORMED_BODY_ERROR when body is not valid JSON", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    checkRole.mockResolvedValue(true);

    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: "not valid json",
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;

    const controller = new OccupationGroupPUTController();
    const actualResponse = await controller.put(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  testUnsupportedMediaType(putHandler);
  testRequestJSONSchema(putSchemaInvalidHandler);
  testRequestJSONMalformed(putHandler);
  testTooLargePayload(
    HTTP_VERBS.PUT,
    OccupationGroupAPISpecs.OccupationGroup.PUT.Constants.MAX_PUT_PAYLOAD_LENGTH,
    putHandler
  );
});
