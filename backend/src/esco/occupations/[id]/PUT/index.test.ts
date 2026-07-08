import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "../../_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as occupationHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "node:crypto";
import { getRandomString } from "_test_utilities/getMockRandomData";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupation } from "../../_shared/occupation.types";
import { getIOccupationMockData } from "../../_shared/testDataHelper";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
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

const givenValidPayload = (): OccupationAPISpecs.Occupation.PUT.Types.Request.Payload => ({
  modelId: getMockStringId(1),
  code: getMockRandomOccupationCode(false),
  occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
  preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
  description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
  altLabels: [getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
  originUri: `http://some/path/to/api/resources/${randomUUID()}`,
  UUIDHistory: [randomUUID()],
  occupationGroupCode: getMockRandomISCOGroupCode(),
  definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
  scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
  regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
  isLocalized: false,
});

describe("Test for occupation PUT handler", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    checkRole.mockResolvedValue(true);
    const mockServiceRegistry = {
      occupation: {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupation: jest.fn(),
        update: jest.fn(),
        patch: jest.fn(),
        getParent: jest.fn().mockResolvedValue(null),
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      } as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("PUT /models/{modelId}/occupations/{id}", () => {
    test("should respond with FORBIDDEN if user is not a model manager", async () => {
      // GIVEN the user does not have the required role
      checkRole.mockResolvedValue(false);
      const givenModelId = getMockStringId(1);
      const givenPayload = givenValidPayload();
      givenPayload.modelId = givenModelId;
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${getMockStringId(2)}`,
        requestContext: usersRequestContext.REGISTED_USER,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect FORBIDDEN
      expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });

    test("should respond with OK and the updated occupation for a valid request", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = givenValidPayload();
      givenPayload.modelId = givenModelId;
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
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
        update: jest.fn().mockResolvedValue(givenOccupation),
        patch: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
        getParent: jest.fn(),
        getChildren: jest.fn(),
        getSkills: jest.fn(),
      } as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND expect Content-Type header
      expect(actualResponse.headers).toMatchObject({ "Content-Type": "application/json" });
      // AND expect transform to be called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(givenOccupation, givenBaseUrl);
      // AND expect the response body
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
    });

    test("should respond with NOT_FOUND when occupation is not found", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = givenValidPayload();
      givenPayload.modelId = givenModelId;
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service returns null (occupation not found)
      const givenOccupationServiceMock = {
        update: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect NOT_FOUND
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.PUT.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND
      );
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = givenValidPayload();
      givenPayload.modelId = givenModelId;
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service throws MODEL_NOT_FOUND
      const givenOccupationServiceMock = {
        update: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
          ),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect NOT_FOUND
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.Occupation.PUT.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND);
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = givenValidPayload();
      givenPayload.modelId = givenModelId;
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service throws MODEL_IS_RELEASED
      const givenOccupationServiceMock = {
        update: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED)
          ),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.PUT.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL
      );
    });

    test("should respond with BAD_REQUEST when modelId in payload does not match path", async () => {
      // GIVEN a valid request with mismatched modelId
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = givenValidPayload();
      givenPayload.modelId = getMockStringId(99); // different modelId
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is null", async () => {
      // GIVEN a request with null body
      const givenModelId = getMockStringId(1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
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
      const largePayload = "x".repeat(OccupationAPISpecs.Occupation.PUT.Constants.MAX_PUT_PAYLOAD_LENGTH + 1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
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
        httpMethod: HTTP_VERBS.PUT,
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
      const givenPayload = givenValidPayload();
      givenPayload.modelId = givenModelId;
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service throws an unexpected error
      const givenOccupationServiceMock = {
        update: jest.fn().mockRejectedValue(new Error("unexpected")),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect INTERNAL_SERVER_ERROR
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.PUT.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION
      );
    });

    test("should respond with INTERNAL_SERVER_ERROR when FAILED_TO_FETCH_FROM_DB", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = givenValidPayload();
      givenPayload.modelId = givenModelId;
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service throws FAILED_TO_FETCH_FROM_DB
      const givenOccupationServiceMock = {
        update: jest
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
        OccupationAPISpecs.Occupation.PUT.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION
      );
    });

    test("should respond with BAD_REQUEST when JSON body is malformed", async () => {
      // GIVEN a request with invalid JSON
      const givenModelId = getMockStringId(1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
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
      // GIVEN a request with an invalid payload (missing required fields)
      const givenModelId = getMockStringId(1);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify({ invalidField: "value" }),
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
      const givenPayload = givenValidPayload();
      givenPayload.modelId = givenModelId;
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/invalid-id`,
      } as unknown as APIGatewayProxyEvent;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with INTERNAL_SERVER_ERROR for unknown OccupationModelValidationError code", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = givenValidPayload();
      givenPayload.modelId = givenModelId;
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      // AND service throws OccupationModelValidationError with an unknown code
      const unknownError = Object.assign(
        new OccupationModelValidationError(ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED),
        { code: 999 as unknown as ModelForOccupationValidationErrorCode }
      );
      const givenOccupationServiceMock = {
        update: jest.fn().mockRejectedValue(unknownError),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect INTERNAL_SERVER_ERROR
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.PUT.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION
      );
    });

    test("should handle LocalOccupation type and map to ObjectTypes.LocalOccupation", async () => {
      // GIVEN a request with LocalOccupation type
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenPayload = givenValidPayload();
      givenPayload.modelId = givenModelId;
      givenPayload.occupationType = OccupationAPISpecs.Enums.OccupationType.LocalOccupation;
      givenPayload.code = getMockRandomOccupationCode(true);
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      } as unknown as APIGatewayProxyEvent;

      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        update: jest.fn().mockResolvedValue(givenOccupation),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN the handler is invoked
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    });

    test("should respond with BAD_REQUEST when JSON parse throws a non-Error", async () => {
      // GIVEN a body that will cause JSON.parse to throw something other than an Error
      const givenModelId = getMockStringId(1);
      const originalJSONParse = JSON.parse;
      JSON.parse = jest.fn().mockImplementation(() => {
        throw "string error message";
      });

      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.PUT,
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
