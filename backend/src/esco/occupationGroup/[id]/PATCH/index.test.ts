import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import ErrorAPISpecs from "api-specifications/error";
import * as authenticatorModule from "auth/authorizer";
import * as responseModule from "./response";
import { OccupationGroupPATCHController, handler as exportedPatchHandler } from "./index";
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
const mockBuildPATCHResponse = jest.mocked(responseModule.buildPATCHResponse);
const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

describe("OccupationGroupPATCHController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  const patchHandler = async (event: APIGatewayProxyEvent) => {
    return new OccupationGroupPATCHController().patch(event);
  };

  const patchSchemaInvalidHandler = async (event: APIGatewayProxyEvent) => {
    getMockGetSchema().mockReturnValue(jest.fn().mockReturnValue(false) as never);
    return new OccupationGroupPATCHController().patch(event);
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
      httpMethod: HTTP_VERBS.PATCH,
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
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(givenEvent);

    // THEN expect FORBIDDEN status
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("should patch an occupation group and return the transformed response", async () => {
    // GIVEN a valid PATCH request with partial fields
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      preferredLabel: "Patched Label",
      description: "Patched description",
    };
    // AND the service returns a patched occupation group
    const patchedOccupationGroup = { id: "group-1", UUID: "uuid-1" };
    const transformed = { id: "group-1", patched: true };
    mockBuildPATCHResponse.mockReturnValue(transformed as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest.fn().mockResolvedValue(patchedOccupationGroup);

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));

    // THEN expect the service to be called with only the provided fields
    expect(mockServiceRegistry.occupationGroup.patch).toHaveBeenCalledWith(
      "group-1",
      "model-1",
      expect.objectContaining({
        preferredLabel: "Patched Label",
        description: "Patched description",
      })
    );
    // AND expect the response to be built from the patched group
    expect(mockBuildPATCHResponse).toHaveBeenCalledWith(patchedOccupationGroup, "https://resources.example.com");
    // AND expect status OK
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body)).toEqual(transformed);
  });

  test("should patch an occupation group with modelId provided in payload", async () => {
    // GIVEN a valid PATCH request that includes modelId matching the path
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      modelId: "model-1",
      preferredLabel: "Patched Label",
    };
    const patchedOccupationGroup = { id: "group-1" };
    mockBuildPATCHResponse.mockReturnValue({ id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest.fn().mockResolvedValue(patchedOccupationGroup);

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));

    // THEN expect status OK
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    // AND the service to be called with the partial spec
    expect(mockServiceRegistry.occupationGroup.patch).toHaveBeenCalledWith(
      "group-1",
      "model-1",
      expect.objectContaining({ preferredLabel: "Patched Label" })
    );
  });

  test("should respond with NOT_FOUND if the occupation group does not exist", async () => {
    // GIVEN a valid PATCH request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      preferredLabel: "Patched Label",
    };
    // AND the service returns null (not found)
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest.fn().mockResolvedValue(null);

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));

    // THEN expect NOT_FOUND status
    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status404.ErrorCodes.OCCUPATION_GROUP_NOT_FOUND,
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
      preferredLabel: "Patched Label",
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(givenEvent);

    // THEN expect BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status400.ErrorCodes.INVALID_MODEL_ID,
      message: "modelId in payload does not match modelId in path",
      details: "Payload modelId: model-2, Path modelId: model-1",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should NOT return BAD_REQUEST when modelId is not provided in payload (partial update)", async () => {
    // GIVEN a valid PATCH request without modelId in payload
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      preferredLabel: "Patched Label",
    };
    const patchedOccupationGroup = { id: "group-1" };
    mockBuildPATCHResponse.mockReturnValue({ id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest.fn().mockResolvedValue(patchedOccupationGroup);

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));

    // THEN expect status OK (no modelId mismatch error)
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("should respond with NOT_FOUND when the model does not exist", async () => {
    // GIVEN a valid PATCH request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      preferredLabel: "Patched Label",
    };
    // AND the service throws MODEL_NOT_FOUND error
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest
      .fn()
      .mockRejectedValue(
        new OccupationGroupModelValidationError(ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
      );

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));

    // THEN expect NOT_FOUND status
    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
      message: "Model not found by the provided ID",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with BAD_REQUEST when the model is released", async () => {
    // GIVEN a valid PATCH request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      preferredLabel: "Patched Label",
    };
    // AND the service throws MODEL_IS_RELEASED error
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest
      .fn()
      .mockRejectedValue(
        new OccupationGroupModelValidationError(ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED)
      );

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));

    // THEN expect BAD_REQUEST status
    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status400.ErrorCodes
          .UNABLE_TO_ALTER_RELEASED_MODEL,
      message: "Cannot update occupation groups in a released model",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with INTERNAL_SERVER_ERROR when failed to fetch model from DB", async () => {
    // GIVEN a valid PATCH request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      preferredLabel: "Patched Label",
    };
    // AND the service throws FAILED_TO_FETCH_FROM_DB error
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest
      .fn()
      .mockRejectedValue(
        new OccupationGroupModelValidationError(ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB)
      );

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));

    // THEN expect INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status500.ErrorCodes
          .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
      message: "Failed to fetch the model details from the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with INTERNAL_SERVER_ERROR for unknown validation error code", async () => {
    // GIVEN a valid PATCH request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      preferredLabel: "Patched Label",
    };
    // AND the service throws an unknown validation error
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest
      .fn()
      .mockRejectedValue(new OccupationGroupModelValidationError(999 as ModelForOccupationGroupValidationErrorCode));

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));

    // THEN expect INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status500.ErrorCodes
          .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
      message: "Failed to update the occupation group in the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with INTERNAL_SERVER_ERROR when service.patch throws a generic error", async () => {
    // GIVEN a valid PATCH request
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      preferredLabel: "Patched Label",
    };
    // AND the service throws a generic error
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest.fn().mockRejectedValue(new Error("Generic error"));

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));

    // THEN expect INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status500.ErrorCodes
          .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
      message: "Failed to update the occupation group in the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("PATCH should return BAD_REQUEST when body is null", async () => {
    const validateFunction = jest.fn().mockReturnValue(false);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: null,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
    checkRole.mockResolvedValue(true);
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should respond with BAD_REQUEST when the path parameters are invalid", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "application/json" },
      pathParameters: {},
      path: "/invalid/path",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
    checkRole.mockResolvedValue(true);

    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return OK when patching with LocalGroup groupType", async () => {
    // GIVEN a PATCH request with LocalGroup groupType
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.LocalGroup,
      preferredLabel: "Local Group Label",
    };
    const patchedOccupationGroup = { id: "group-1", UUID: "uuid-1" };
    mockBuildPATCHResponse.mockReturnValue({ id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest.fn().mockResolvedValue(patchedOccupationGroup);

    // WHEN the handler is invoked
    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));

    // THEN expect status OK
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("should return OK when patching with ISCOGroup groupType", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: "ISCO Group Label",
    };
    const patchedOccupationGroup = { id: "group-1" };
    mockBuildPATCHResponse.mockReturnValue({ id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest.fn().mockResolvedValue(patchedOccupationGroup);

    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("should return the response from the exported handler", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      preferredLabel: "Patched from exported handler",
    };
    const patchedOccupationGroup = { id: "group-1", UUID: "uuid-1" };
    mockBuildPATCHResponse.mockReturnValue({ id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest.fn().mockResolvedValue(patchedOccupationGroup);

    const event = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
    const actualResponse = await exportedPatchHandler(event);
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("should handle AJV schema not found for request payload", async () => {
    getMockGetSchema().mockReturnValue(undefined);
    checkRole.mockResolvedValue(true);

    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;

    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should patch all optional fields: originUri, code, altLabels, UUIDHistory", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = {
      originUri: "https://updated.example.com",
      code: "9999",
      altLabels: ["alt-new"],
      UUIDHistory: ["old-uuid"],
      preferredLabel: "All fields",
    };
    const patchedOccupationGroup = { id: "group-1" };
    mockBuildPATCHResponse.mockReturnValue({ id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest.fn().mockResolvedValue(patchedOccupationGroup);

    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(buildEvent(payload));
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);

    expect(mockServiceRegistry.occupationGroup.patch).toHaveBeenCalledWith(
      "group-1",
      "model-1",
      expect.objectContaining({
        originUri: "https://updated.example.com",
        code: "9999",
        altLabels: ["alt-new"],
        UUIDHistory: ["old-uuid"],
      })
    );
  });

  test("should accept lowercase content-type header in request", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);

    const payload = { preferredLabel: "Lowercase header" };
    const patchedOccupationGroup = { id: "group-1" };
    mockBuildPATCHResponse.mockReturnValue({ id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.patch = jest.fn().mockResolvedValue(patchedOccupationGroup);

    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;

    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(givenEvent);
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("should return MALFORMED_BODY_ERROR when body is not valid JSON", async () => {
    const validateFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validateFunction as never);
    checkRole.mockResolvedValue(true);

    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: "not valid json",
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: "model-1", id: "group-1" },
      path: "/models/model-1/occupationGroups/group-1",
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;

    const controller = new OccupationGroupPATCHController();
    const actualResponse = await controller.patch(givenEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  testUnsupportedMediaType(patchHandler);
  testRequestJSONSchema(patchSchemaInvalidHandler);
  testRequestJSONMalformed(patchHandler);
  testTooLargePayload(
    HTTP_VERBS.PATCH,
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Constants.MAX_PATCH_PAYLOAD_LENGTH,
    patchHandler
  );
});
