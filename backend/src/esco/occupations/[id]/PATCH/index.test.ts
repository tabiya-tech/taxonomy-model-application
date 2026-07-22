import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "../../_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as occupationHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { ObjectTypes } from "esco/common/objectTypes";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { IOccupation } from "../../_shared/occupation.types";
import { getIOccupationMockData } from "../../_shared/testDataHelper";
import {
  IOccupationService,
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "../../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
const transformSpy = jest.spyOn(transformModule, "transform");

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation PATCH handler", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    checkRole.mockResolvedValue(true);
    const mockServiceRegistry = {
      occupation: {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
        update: jest.fn(),
        patch: jest.fn(),
        getParent: jest.fn().mockResolvedValue(null),
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getHistory: jest.fn().mockResolvedValue(null),
      } as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("PATCH /models/{modelId}/occupations/{id}", () => {
    test("should respond with FORBIDDEN if user is not a model manager", async () => {
      // GIVEN the user does not have the required role
      checkRole.mockResolvedValue(false);
      const givenModelId = getMockStringId(1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ preferredLabel: "New Label" }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${getMockStringId(2)}`,
        requestContext: usersRequestContext.REGISTED_USER,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect FORBIDDEN
      expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });

    test("should respond with OK and the updated occupation when only preferredLabel is provided", async () => {
      // GIVEN a partial request with only preferredLabel
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload: OccupationAPISpecs.Occupation.PATCH.Types.Request.Payload = {
        preferredLabel: "Updated Preferred Label",
      };
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND a configured base URL
      const givenBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenBaseUrl);

      // AND the service returns the updated occupation
      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        patch: jest.fn().mockResolvedValue(givenOccupation),
        getHistory: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND expect transform called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(givenOccupation, givenBaseUrl);
      // AND expect the response body
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
      // AND service.patch called with only the provided fields
      expect(givenOccupationServiceMock.patch).toHaveBeenCalledWith(
        givenOccupationId,
        givenModelId,
        expect.objectContaining({ preferredLabel: "Updated Preferred Label" })
      );
    });

    test("should respond with OK when an empty patch body is sent", async () => {
      // GIVEN an empty payload ({}), which is valid for PATCH
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND the service returns the occupation unchanged
      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        patch: jest.fn().mockResolvedValue(givenOccupation),
        getHistory: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    });

    test("should respond with NOT_FOUND when occupation is not found", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ preferredLabel: "Label" }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND the service returns null (occupation not found)
      const givenOccupationServiceMock = {
        patch: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect NOT_FOUND
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.PATCH.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND
      );
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ preferredLabel: "Label" }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service throws MODEL_NOT_FOUND
      const givenOccupationServiceMock = {
        patch: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
          ),
        getHistory: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect NOT_FOUND
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.Occupation.PATCH.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND);
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ preferredLabel: "Label" }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service throws MODEL_IS_RELEASED
      const givenOccupationServiceMock = {
        patch: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED)
          ),
        getHistory: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.PATCH.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL
      );
    });

    test("should respond with BAD_REQUEST when body is null", async () => {
      // GIVEN a request with null body
      const givenModelId = getMockStringId(1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: null,
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${getMockStringId(2)}`,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with TOO_LARGE_PAYLOAD when payload exceeds size limit", async () => {
      // GIVEN a payload that is too large
      const givenModelId = getMockStringId(1);
      const largePayload = "x".repeat(OccupationAPISpecs.Occupation.PATCH.Constants.MAX_PATCH_PAYLOAD_LENGTH + 1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: largePayload,
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${getMockStringId(2)}`,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect TOO_LARGE_PAYLOAD
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when Content-Type is wrong", async () => {
      // GIVEN a request with wrong Content-Type
      const givenModelId = getMockStringId(1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: "{}",
        headers: { "Content-Type": "text/plain" },
        path: `/models/${givenModelId}/occupations/${getMockStringId(2)}`,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect UNSUPPORTED_MEDIA_TYPE
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with INTERNAL_SERVER_ERROR when service throws an unexpected error", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ preferredLabel: "Label" }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service throws an unexpected error
      const givenOccupationServiceMock = {
        patch: jest.fn().mockRejectedValue(new Error("unexpected")),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect INTERNAL_SERVER_ERROR
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.PATCH.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION
      );
    });

    test("should only send provided fields to service, not undefined ones", async () => {
      // GIVEN a partial payload with only description
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = { description: "New Description Only" };
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        patch: jest.fn().mockResolvedValue(givenOccupation),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      await occupationHandler(givenEvent);

      // THEN the spec passed to service should only contain description
      const callArgs = (givenOccupationServiceMock.patch as jest.Mock).mock.calls[0];
      const passedSpec = callArgs[2]; // third arg is spec
      expect(passedSpec).toEqual({ description: "New Description Only" });
      // AND should NOT contain preferredLabel, code, etc.
      expect(passedSpec).not.toHaveProperty("preferredLabel");
      expect(passedSpec).not.toHaveProperty("code");
    });

    test("should respond with INTERNAL_SERVER_ERROR when FAILED_TO_FETCH_FROM_DB", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ preferredLabel: "Label" }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service throws FAILED_TO_FETCH_FROM_DB
      const givenOccupationServiceMock = {
        patch: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB)
          ),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect INTERNAL_SERVER_ERROR
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.PATCH.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION
      );
    });

    test("should respond with BAD_REQUEST when JSON body is malformed", async () => {
      // GIVEN a request with invalid JSON
      const givenModelId = getMockStringId(1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: "not valid json",
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${getMockStringId(2)}`,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when payload fails AJV validation", async () => {
      // GIVEN a request with an invalid payload
      const givenModelId = getMockStringId(1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ occupationType: "InvalidType" }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${getMockStringId(2)}`,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when path params are invalid", async () => {
      // GIVEN a request with an invalid occupation ID in path
      const givenModelId = getMockStringId(1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ preferredLabel: "Label" }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/invalid-id`,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should include occupationType mapping when occupationType is provided", async () => {
      // GIVEN a PATCH request that includes occupationType
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = {
        occupationType: OccupationAPISpecs.Enums.OccupationType.LocalOccupation,
        preferredLabel: "Local Label",
      };
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        patch: jest.fn().mockResolvedValue(givenOccupation),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    });

    test("should respond with INTERNAL_SERVER_ERROR for unknown OccupationModelValidationError code", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ preferredLabel: "Label" }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service throws OccupationModelValidationError with an unknown code
      const unknownError = Object.assign(
        new OccupationModelValidationError(ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED),
        { code: 999 as unknown as ModelForOccupationValidationErrorCode }
      );
      const givenOccupationServiceMock = {
        patch: jest.fn().mockRejectedValue(unknownError),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect INTERNAL_SERVER_ERROR
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.PATCH.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION
      );
    });

    test("should respond with BAD_REQUEST when payload modelId does not match path modelId", async () => {
      // GIVEN a request with mismatched modelId
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ modelId: getMockStringId(99) }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should pass all provided fields through to the service", async () => {
      // GIVEN a PATCH request with all mutable fields
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = {
        code: "1234.5.6",
        occupationGroupCode: "1234",
        preferredLabel: "New Label",
        originUri: "http://example.com/new",
        altLabels: ["alt1", "alt2"],
        definition: "New Definition",
        description: "New Description",
        regulatedProfessionNote: "New Note",
        scopeNote: "New Scope",
        modelId: givenModelId,
        UUIDHistory: ["550e8400-e29b-41d4-a716-446655440000"],
        isLocalized: true,
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      };
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        patch: jest.fn().mockResolvedValue(givenOccupation),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND all fields are passed to the service
      const callArgs = (givenOccupationServiceMock.patch as jest.Mock).mock.calls[0];
      const passedSpec = callArgs[2];
      expect(passedSpec).toMatchObject({
        code: "1234.5.6",
        occupationGroupCode: "1234",
        preferredLabel: "New Label",
        originUri: "http://example.com/new",
        altLabels: ["alt1", "alt2"],
        definition: "New Definition",
        description: "New Description",
        regulatedProfessionNote: "New Note",
        scopeNote: "New Scope",
        modelId: givenModelId,
        UUIDHistory: ["550e8400-e29b-41d4-a716-446655440000"],
        isLocalized: true,
        occupationType: ObjectTypes.ESCOOccupation,
      });
    });

    test("should map ESCOOccupation enum to ObjectTypes.ESCOOccupation", async () => {
      // GIVEN a PATCH request with ESCOOccupation type
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        patch: jest.fn().mockResolvedValue(givenOccupation),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN
      await occupationHandler(givenEvent);

      // THEN occupationType is mapped
      const callArgs = (givenOccupationServiceMock.patch as jest.Mock).mock.calls[0];
      expect(callArgs[2].occupationType).toEqual(ObjectTypes.ESCOOccupation);
    });

    test("should map LocalOccupation enum to ObjectTypes.LocalOccupation", async () => {
      // GIVEN a PATCH request with LocalOccupation type
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: JSON.stringify({ occupationType: OccupationAPISpecs.Enums.OccupationType.LocalOccupation }),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        patch: jest.fn().mockResolvedValue(givenOccupation),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN
      await occupationHandler(givenEvent);

      // THEN occupationType is mapped to LocalOccupation
      const callArgs = (givenOccupationServiceMock.patch as jest.Mock).mock.calls[0];
      expect(callArgs[2].occupationType).toEqual(ObjectTypes.LocalOccupation);
    });

    test("should respond with BAD_REQUEST when JSON parse throws a non-Error", async () => {
      // GIVEN a body that will cause JSON.parse to throw something other than an Error
      const givenModelId = getMockStringId(1);
      const originalJSONParse = JSON.parse;
      JSON.parse = jest.fn().mockImplementation(() => {
        throw "string error message";
      });

      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PATCH,
        body: "something",
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${getMockStringId(2)}`,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      JSON.parse = originalJSONParse;
    });
  });
});
