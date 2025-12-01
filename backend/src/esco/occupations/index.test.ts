import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "./transform";
import { handler as occupationHandler, OccupationController } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import { randomUUID } from "node:crypto";
import ErrorAPISpecs from "api-specifications/error";
import { getRandomString } from "_test_utilities/getMockRandomData";
import OccupationAPISpecs from "api-specifications/esco/occupation";

import * as authenticatorModule from "auth/authenticator";
import { usersRequestContext } from "_test_utilities/dataModel";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupation, IOccupationWithoutImportId } from "./occupation.types";
import { getIOccupationMockData } from "./testDataHelper";
import {
  IOccupationService,
  ModalForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "./occupationService.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IModelRepository } from "modelInfo/modelInfoRepository";

import {
  testMethodsNotAllowed,
  testRequestJSONMalformed,
  testRequestJSONSchema,
  testTooLargePayload,
  testUnsupportedMediaType,
} from "_test_utilities/stdRESTHandlerTests";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockReturnValue(true);

const transformSpy = jest.spyOn(transformModule, "transform");
const transformPaginatedSpy = jest.spyOn(transformModule, "transformPaginated");

// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation handler", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Initialize the service registry mock
    const mockServiceRegistry = {
      occupation: {
        create: jest.fn(),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
      } as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("POST", () => {
    describe("Security tests", () => {
      test("should response with FORBIDDEN status code if a user is not a model manager", async () => {
        // GIVEN The user is a registered user (not a model manager)
        const givenRequestContext = usersRequestContext.REGISTED_USER;

        // AND checkRole return false
        checkRole.mockReturnValue(false);

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
        const actualResponse = await occupationHandler(givenEvent);

        // THEN expect the handler to respond with the FORBIDDEN status
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("POST should response with the CREATED status code and the newly created occupation for a valid and max size payload", async () => {
      // GIVEN a valid request (method & header & payload)
      const givenModelId = getMockStringId(1);

      const givenPayload: OccupationAPISpecs.Types.POST.Request.Payload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        altLabels: [
          getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
          getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
        ],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
        scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        isLocalized: false,
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND the service that will successfully create the occupation
      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        create: jest.fn().mockResolvedValue(givenOccupation),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as IOccupationService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupation = givenOccupationServiceMock;

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect the handler to call the service with the given payload
      expect(getServiceRegistry().occupation.create).toHaveBeenCalledWith({ ...givenPayload });
      // AND respond with the CREATED status code
      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the transformation function is called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(
        {
          ...givenOccupation,
        },
        givenResourcesBaseUrl
      );
      // AND the handler to return the expected result
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
    });
    test("POST should respond with the INTERNAL_SERVER_ERROR status code if the repository failed to create the occupation", async () => {
      // GIVEN a valid request {method & header & payload}
      const givenModelId = getMockStringId(1);

      const givenPayload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        altLabels: [
          getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
          getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
        ],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
        scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        isLocalized: false,
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      const givenOccupationServiceMock = {
        create: jest.fn().mockRejectedValue(new Error("foo")),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupation: jest.fn().mockResolvedValue({ isValid: true }),
      } as IOccupationService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupation = givenOccupationServiceMock;
      const givenModelInfoRepositoryMock = {
        getModelById: jest.fn().mockResolvedValue({ id: givenModelId, released: false }),
        Model: undefined as never,
        create: jest.fn(),
        getModelByUUID: jest.fn(),
        getModels: jest.fn(),
        getHistory: jest.fn(),
      } as IModelRepository;
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect the handler to call the service with the given payload
      expect(getServiceRegistry().occupation.create).toHaveBeenCalledWith({ ...givenPayload });
      // AND to respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody = {
        errorCode: OccupationAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
        message: "Failed to create the occupation in the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("POST should respond with BAD_REQUEST when modelId in path is missing", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: "label",
        description: "desc",
        altLabels: [],
        originUri: `http://some/path/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: "def",
        scopeNote: "scope",
        regulatedProfessionNote: "note",
        isLocalized: false,
      };
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
      } as never;
      checkRole.mockReturnValue(true);
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("POST should respond with BAD_REQUEST when modelId in payload doesn't match path", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: getMockStringId(2),
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        altLabels: [],
        originUri: `http://some/path/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
        scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        isLocalized: false,
      };
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as never;
      checkRole.mockReturnValue(true);
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("POST should respond with REQUEST_TOO_LONG when payload is too large", async () => {
      const givenModelId = getMockStringId(1);
      const largePayload = "x".repeat(OccupationAPISpecs.Constants.MAX_POST_PAYLOAD_LENGTH + 1);
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: largePayload,
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as never;
      checkRole.mockReturnValue(true);
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("POST should respond with BAD_REQUEST when body is null", async () => {
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: null,
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as never;
      checkRole.mockReturnValue(true);
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST); // Request body is empty
    });

    test("POST should respond with NOT_FOUND when model doesn't exist", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        altLabels: [],
        originUri: `http://some/path/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
        scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        isLocalized: false,
      };
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as never;
      checkRole.mockReturnValue(true);
      const givenOccupationServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModalForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
          ),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
      } as IOccupationService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupation = givenOccupationServiceMock;
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.Enums.POST.Response.ErrorCodes.INVALID_MODEL_ID);
      expect(body.message).toEqual("Model not found by the provided ID");
    });

    test("POST should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        altLabels: [],
        originUri: `http://some/path/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
        scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        isLocalized: false,
      };
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as never;
      checkRole.mockReturnValue(true);
      const givenOccupationServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModalForOccupationValidationErrorCode.MODEL_IS_RELEASED)
          ),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
      } as IOccupationService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupation = givenOccupationServiceMock;
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.Enums.POST.Response.ErrorCodes.MODEL_ALREADY_RELEASED);
      expect(body.message).toEqual("Cannot add occupations to a released model");
    });

    test("POST should respond with BAD_REQUEST if parseJSON throws an Error", async () => {
      const givenThrownError = new Error("an error");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseSpy = jest.spyOn<any, any>(OccupationController.prototype, "parseJSON").mockImplementation(() => {
        throw givenThrownError;
      });

      try {
        const givenEvent = {
          httpMethod: HTTP_VERBS.POST,
          body: "foo",
          headers: { "Content-Type": "application/json" },
          path: `/models/${getMockStringId(1)}/occupations`,
          pathParameters: { modelId: getMockStringId(1) },
        } as never;
        checkRole.mockReturnValue(true);
        const actualResponse = await occupationHandler(givenEvent);
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY);
        expect(body.message).toEqual(ErrorAPISpecs.Constants.ReasonPhrases.MALFORMED_BODY);
        expect(body.details).toEqual(givenThrownError.message);
      } finally {
        parseSpy.mockRestore();
      }
    });

    test("POST should respond with INTERNAL_SERVER_ERROR when failed to fetch model details from DB", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        altLabels: [],
        originUri: `http://some/path/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
        scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        isLocalized: false,
      };
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as never;
      checkRole.mockReturnValue(true);
      const givenOccupationServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModalForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB)
          ),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
      } as IOccupationService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupation = givenOccupationServiceMock;
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION);
      expect(body.message).toEqual("Failed to fetch the model details from the DB");
    });

    test("POST should respond with INTERNAL_SERVER_ERROR for unknown validation error code", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        altLabels: [],
        originUri: `http://some/path/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
        scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        isLocalized: false,
      };
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as never;
      checkRole.mockReturnValue(true);
      const givenOccupationServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(new OccupationModelValidationError(3 as ModalForOccupationValidationErrorCode)),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
      } as IOccupationService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupation = givenOccupationServiceMock;
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION);
      expect(body.message).toEqual("Failed to create the occupation in the DB");
    });

    testUnsupportedMediaType(occupationHandler);
    testRequestJSONSchema(occupationHandler);
    testRequestJSONMalformed(occupationHandler);
    testTooLargePayload(HTTP_VERBS.POST, OccupationAPISpecs.Constants.MAX_POST_PAYLOAD_LENGTH, occupationHandler);

    test("POST should return FORBIDDEN status code if the user does not have the required role", async () => {
      // GIVEN a valid request (method & header & payload)
      const givenModelId = getMockStringId(1);

      const givenPayload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        altLabels: [
          getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
          getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
        ],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
        scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        isLocalized: false,
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
      } as never;

      // AND the user does not have the required role
      checkRole.mockReturnValue(false);

      // WHEN the occupation handler is invoked with the given event
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect the handler to return the FORBIDDEN status
      expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });
  });

  describe("GET", () => {
    describe("GET /occupations/{id}", () => {
      const givenModelId = getMockStringId(1);
      const givenId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        path: `/models/${givenModelId}/occupations/${givenId}`,
        pathParameters: { modelId: givenModelId, id: givenId },
        queryStringParameters: {},
      };

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);

      test("GET /occupations/{id} should return the occupation for the given id", async () => {
        // GIVEN a service that will successfully get the occupation
        const givenOccupation: IOccupation = getIOccupationMockData();

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the transformation function is called correctly
        expect(transformModule.transform).toHaveBeenCalledWith(givenOccupation, givenResourcesBaseUrl);
        // AND the handler to return the expected result
        expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
      });

      test("GET /occupations/{id} should respond with NOT_FOUND if the model does not exist", async () => {
        // GIVEN role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // AND the model does not exist
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModalForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the NOT_FOUND status
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.MODEL_NOT_FOUND,
          message: "Model not found",
          details: `No model found with id: ${givenModelId}`,
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations/{id} should respond with INTERNAL_SERVER_ERROR if failed to fetch model details from DB", async () => {
        // GIVEN role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // AND failed to fetch model details
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModalForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to fetch the model details from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations/{id} should respond with NOT_FOUND if the occupation does not exist", async () => {
        // GIVEN a service that returns null for the occupation
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn(),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the NOT_FOUND status
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Occupation not found",
          details: JSON.stringify({ id: givenId }),
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if modelId is missing", async () => {
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models//occupations/${givenId}`,
          pathParameters: { id: givenId },
          queryStringParameters: {},
        };

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenBadEvent as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedMissing = JSON.parse(actualResponse.body);
        expect(parsedMissing).toMatchObject({
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_MODEL_ID,
          message: "modelId is missing in the path",
        });
        expect(typeof parsedMissing.details).toBe("string");
      });

      test("GET /occupations/{id} should extract modelId from path when pathParameters.modelId is not set", async () => {
        // GIVEN a service that will successfully get the occupation
        const givenOccupation: IOccupation = getIOccupationMockData();

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const givenEventWithoutPathParams = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations/${givenId}`,
          pathParameters: { id: givenId }, // modelId not set
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEventWithoutPathParams as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the transformation function is called correctly
        expect(transformModule.transform).toHaveBeenCalledWith(givenOccupation, givenResourcesBaseUrl);
        // AND the handler to return the expected result
        expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
      });

      test("GET /occupations/{id} should extract id from path when pathParameters.id is not set", async () => {
        // GIVEN a service that will successfully get the occupation
        const givenOccupation: IOccupation = getIOccupationMockData();

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const givenEventWithoutIdParams = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations/${givenId}`,
          pathParameters: { modelId: givenModelId }, // id not set
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEventWithoutIdParams as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the transformation function is called correctly
        expect(transformModule.transform).toHaveBeenCalledWith(givenOccupation, givenResourcesBaseUrl);
        // AND the handler to return the expected result
        expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
      });

      test("GET /occupations/{id} should handle when event.path is undefined", async () => {
        // GIVEN a service that will successfully get the occupation
        const givenOccupation: IOccupation = getIOccupationMockData();

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // Mock pathToRegexp to return a match even for empty string
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pathToRegexpMock = jest.spyOn(require("path-to-regexp"), "pathToRegexp");
        pathToRegexpMock.mockReturnValue({
          regexp: {
            exec: jest.fn().mockReturnValue([`/models/${givenModelId}/occupations/${givenId}`, givenModelId, givenId]),
          },
          keys: [],
        });

        const givenEventWithUndefinedPath = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: undefined, // path is undefined
          pathParameters: { modelId: givenModelId, id: givenId },
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEventWithUndefinedPath as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the transformation function is called correctly
        expect(transformModule.transform).toHaveBeenCalledWith(givenOccupation, givenResourcesBaseUrl);
        // AND the handler to return the expected result
        expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);

        // Restore the mock
        pathToRegexpMock.mockRestore();
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if id is missing", async () => {
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations/${givenId}`, // has id segment
          pathParameters: { modelId: givenModelId, id: "" }, // id is empty string
          queryStringParameters: {},
        };

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenBadEvent as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedMissing = JSON.parse(actualResponse.body);
        expect(parsedMissing).toMatchObject({
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_OCCUPATION_ID,
          message: "id is missing in the path",
        });
        expect(typeof parsedMissing.details).toBe("string");
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if modelId is invalid", async () => {
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${getMockStringId(1)}/occupations/${givenId}`,
          pathParameters: { modelId: "foo", id: givenId },
          queryStringParameters: {},
        };

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenBadEvent as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedInvalidModel = JSON.parse(actualResponse.body);
        expect(parsedInvalidModel).toMatchObject({
          errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
        });
        expect(typeof parsedInvalidModel.details).toBe("string");
      });

      test("GET /occupations/{id} should respond with INTERNAL_SERVER_ERROR if the service fails", async () => {
        // GIVEN a service that fails to get the occupation
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockRejectedValue(new Error("foo")),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to retrieve the occupation from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if id cannot be extracted from path or pathParameters", async () => {
        // Mock pathToRegexp to return a regex that doesn't capture id
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mockPathToRegexp = jest.spyOn(require("path-to-regexp"), "pathToRegexp");
        const mockRegexp = {
          exec: jest
            .fn()
            .mockReturnValue([`/models/${getMockStringId(1)}/occupations/some-id`, getMockStringId(1), undefined]),
        };
        mockPathToRegexp.mockReturnValue({
          regexp: mockRegexp,
          keys: [],
        });

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${getMockStringId(1)}/occupations/some-id`,
          pathParameters: { modelId: getMockStringId(1) },
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("id is missing in the path");
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_OCCUPATION_ID);

        // Restore
        mockPathToRegexp.mockRestore();
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if modelId cannot be extracted from path or pathParameters", async () => {
        // Mock pathToRegexp to return a regex that doesn't capture modelId
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mockPathToRegexp = jest.spyOn(require("path-to-regexp"), "pathToRegexp");
        const mockRegexp = {
          exec: jest
            .fn()
            .mockReturnValue([`/models/some-model/occupations/${getMockStringId(2)}`, undefined, getMockStringId(2)]),
        };
        mockPathToRegexp.mockReturnValue({
          regexp: mockRegexp,
          keys: [],
        });

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/some-model/occupations/${getMockStringId(2)}`,
          pathParameters: { id: getMockStringId(2) }, // modelId missing from params
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("modelId is missing in the path");
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_MODEL_ID);

        // Restore
        mockPathToRegexp.mockRestore();
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if id cannot be extracted from path or pathParameters", async () => {
        // Mock pathToRegexp to return a regex that doesn't capture id
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mockPathToRegexp = jest.spyOn(require("path-to-regexp"), "pathToRegexp");
        const mockRegexp = {
          exec: jest
            .fn()
            .mockReturnValue([`/models/${getMockStringId(1)}/occupations/some-id`, getMockStringId(1), undefined]),
        };
        mockPathToRegexp.mockReturnValue({
          regexp: mockRegexp,
          keys: [],
        });

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${getMockStringId(1)}/occupations/some-id`,
          pathParameters: { modelId: getMockStringId(1) },
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("id is missing in the path");
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_OCCUPATION_ID);

        // Restore
        mockPathToRegexp.mockRestore();
      });
    });

    describe("GET /occupations (paginated)", () => {
      // GIVEN a valid GET request (method & header)
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString() },
        queryStringParameters: {},
      };

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);

      test("GET should return only the occupations for the given modelId", async () => {
        // AND GIVEN a service that will successfully get an arbitrary number (N) of models
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);
        const givenOccupations: Array<IOccupation> = [
          {
            ...getIOccupationMockData(1),
            modelId: givenModelId,
            UUID: "foo",
            UUIDHistory: ["foo"],
            importId: "",
          },
          {
            ...getIOccupationMockData(2),
            modelId: givenModelId,
            UUID: "bar",
            UUIDHistory: ["bar"],
            importId: "",
          },
          {
            ...getIOccupationMockData(3),
            modelId: givenModelId,
            UUID: "baz",
            UUIDHistory: ["baz"],
            importId: "",
          },
        ];

        const firstPageOccupations = givenOccupations.slice(-2);

        const limit = 2;
        const firstPageCursor = Buffer.from(
          JSON.stringify({ id: givenOccupations[2].id, createdAt: givenOccupations[2].createdAt })
        ).toString("base64");

        const expectedNextCursor = null;

        // Ensure role check passes for anonymous
        checkRole.mockReturnValueOnce(true);

        // AND a service that will successfully get the limited occupations
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn().mockResolvedValue({ items: firstPageOccupations, nextCursor: null }),
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
        } as IOccupationService;

        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event and the modelId as path parameter
        const actualResponse = await occupationHandler({
          ...givenEvent,
          queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
        } as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the response body contains only the first page Occupations
        expect(JSON.parse(actualResponse.body)).toMatchObject({
          data: expect.arrayContaining(
            firstPageOccupations.map((og) =>
              expect.objectContaining({
                UUID: og.UUID,
                UUIDHistory: og.UUIDHistory,
                code: og.code,
                originUri: og.originUri,
                preferredLabel: og.preferredLabel,
                altLabels: og.altLabels,
                occupationType: og.occupationType,
                description: og.description,
                id: og.id,
                modelId: og.modelId,
                createdAt: og.createdAt.toISOString(),
                updatedAt: og.updatedAt.toISOString(),
                path: `${givenResourcesBaseUrl}/models/${og.modelId}/occupations/${og.id}`,
                tabiyaPath: `${givenResourcesBaseUrl}/models/${og.modelId}/occupations/${og.UUID}`,
              })
            )
          ),
          limit: limit,
          nextCursor: expectedNextCursor,
        });
        // AND the transformation function is called correctly
        expect(transformPaginatedSpy).toHaveBeenCalledWith(
          firstPageOccupations,
          givenResourcesBaseUrl,
          limit,
          expectedNextCursor
        );
      });

      test("GET should return nextCursor when nextCursor is present in the paginated result", async () => {
        // GIVEN a service that returns occupations with more than limit items to trigger nextCursor
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const limit = 1;
        const givenOccupations: Array<IOccupationWithoutImportId> = [
          {
            ...getIOccupationMockData(1),
            modelId: givenModelId,
            UUID: "foo",
            UUIDHistory: ["foo"],
            importId: null,
          },
          {
            ...getIOccupationMockData(2),
            modelId: givenModelId,
            UUID: "bar",
            UUIDHistory: ["bar"],
            importId: null,
          },
        ];

        // AND a service that will successfully get the occupations (returns 2 items for limit 1)
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn().mockResolvedValue({
            items: [givenOccupations[0]],
            nextCursor: { _id: givenOccupations[1].id, createdAt: givenOccupations[1].createdAt },
          }),
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
        } as IOccupationService;

        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event and limit 1
        const actualResponse = await occupationHandler({
          ...givenEvent,
          queryStringParameters: { limit: limit.toString() },
        } as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // Verify the service was called correctly
        expect(getServiceRegistry().occupation.findPaginated).toHaveBeenCalledWith(givenModelId, undefined, limit);

        // AND the response body contains a nextCursor (base64 encoded)
        const responseBody = JSON.parse(actualResponse.body);
        expect(responseBody.nextCursor).toBeDefined();
        expect(typeof responseBody.nextCursor).toBe("string");

        // Verify it's a valid base64 string by decoding it
        const decodedCursor = Buffer.from(responseBody.nextCursor, "base64").toString("utf-8");
        const cursorObj = JSON.parse(decodedCursor);
        expect(cursorObj).toHaveProperty("id");
        expect(cursorObj).toHaveProperty("createdAt");

        // AND the transformation function is called correctly
        expect(transformPaginatedSpy).toHaveBeenCalledWith(
          [givenOccupations[0]], // only the first item due to limit
          givenResourcesBaseUrl,
          limit,
          responseBody.nextCursor
        );
      });
      test("GET should respond with the BAD_REQUEST status code if the modelId is not passed as a path parameter", async () => {
        // AND GIVEN the repository fails to get the occupations
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);
        const firstPageCursorObject = {
          id: getMockStringId(1),
          createdAt: new Date(),
        };
        const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

        const limit = 2;

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler({
          ...givenBadEvent,
          queryStringParameters: { limit: limit.toString(), next: firstPageCursor },
        } as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedMissing = JSON.parse(actualResponse.body);
        expect(parsedMissing).toMatchObject({
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_MODEL_ID,
          message: "modelId is missing in the path",
        });
        expect(typeof parsedMissing.details).toBe("string");
      });
      test("GET should respond with the BAD_REQUEST status code if the modelId is not correct model id", async () => {
        // AND GIVEN the repository fails to get the occupations
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);
        const firstPageCursorObject = {
          id: getMockStringId(1),
          createdAt: new Date(),
        };
        const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

        const limit = 2;

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          pathParameters: { modelId: "foo" },
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler({
          ...givenBadEvent,
          queryStringParameters: { limit: limit.toString(), next: firstPageCursor },
        } as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedInvalidModel = JSON.parse(actualResponse.body);
        expect(parsedInvalidModel).toMatchObject({
          errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
        });
        expect(typeof parsedInvalidModel.details).toBe("string");
      });
      test("GET should respond with the BAD_REQUEST status code if the query parameter is not valid query parameter", async () => {
        // AND GIVEN the repository fails to get the occupations
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);
        const firstPageCursorObject = {
          id: getMockStringId(1),
          createdAt: new Date(),
        };
        const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler({
          ...givenEvent,
          queryStringParameters: { limit: "foo", next: firstPageCursor },
        } as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedInvalidQuery = JSON.parse(actualResponse.body);
        expect(parsedInvalidQuery).toMatchObject({
          errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
        });
        expect(typeof parsedInvalidQuery.details).toBe("string");
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if modelId is missing from path and pathParameters", async () => {
        // Path does NOT include /models/{modelId} at all
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: "/occupations", // ← no modelId segment!
          pathParameters: {}, // modelId missing
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("modelId is missing in the path");
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_MODEL_ID);
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if modelId cannot be extracted from path or pathParameters", async () => {
        // Mock pathToRegexp to return a regex that doesn't capture modelId
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mockPathToRegexp = jest.spyOn(require("path-to-regexp"), "pathToRegexp");
        const mockRegexp = {
          exec: jest.fn().mockReturnValue(["/models/some-model/occupations", undefined]),
        };
        mockPathToRegexp.mockReturnValue({
          regexp: mockRegexp,
          keys: [],
        });

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: "/models/some-model/occupations",
          pathParameters: {}, // modelId missing from params
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("modelId is missing in the path");
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_MODEL_ID);

        // Restore
        mockPathToRegexp.mockRestore();
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if query parameters are invalid", async () => {
        const givenModelId = getMockStringId(1);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations`,
          pathParameters: { modelId: givenModelId },
          queryStringParameters: { limit: "invalid" },
        } as unknown as APIGatewayProxyEvent;

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe(ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA);
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if path parameters are invalid", async () => {
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/invalid/occupations`,
          pathParameters: { modelId: "invalid" },
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe(ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA);
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if query parameters are invalid", async () => {
        const givenModelId = getMockStringId(1);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations`,
          pathParameters: { modelId: givenModelId },
          queryStringParameters: { limit: "invalid" },
        } as unknown as APIGatewayProxyEvent;

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe(ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA);
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
      });

      test("GET /occupations (paginated) should extract modelId from path when pathParameters.modelId is not set", async () => {
        // GIVEN a service that will successfully get an arbitrary number (N) of models
        const givenModelId = getMockStringId(1);
        const givenOccupations: Array<IOccupation> = [
          {
            ...getIOccupationMockData(1),
            modelId: givenModelId,
            UUID: "foo",
            UUIDHistory: ["foo"],
            importId: "",
          },
        ];

        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn().mockResolvedValue({ items: givenOccupations, nextCursor: null }),
          validateModelForOccupation: jest.fn().mockResolvedValue({ isValid: true }),
        } as IOccupationService;

        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // WHEN the occupation handler is invoked with pathParameters.modelId not set, but path matches regex
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations`,
          pathParameters: {}, // modelId not set
          queryStringParameters: {},
        } as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the response body contains the occupations
        expect(JSON.parse(actualResponse.body)).toMatchObject({
          data: expect.arrayContaining(
            givenOccupations.map((og) =>
              expect.objectContaining({
                UUID: og.UUID,
                modelId: og.modelId,
              })
            )
          ),
          limit: 100,
          nextCursor: null,
        });
      });

      test("GET should respond with the INTERNAL_SERVER_ERROR status code if the service fails to get the occupations", async () => {
        // AND GIVEN the service fails to get the occupations
        const firstPageCursorObject = {
          id: getMockStringId(1),
          createdAt: new Date(),
        };
        const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn().mockRejectedValue(new Error("foo")),
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;
        const limit = 2;

        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler({
          ...givenEvent,
          queryStringParameters: { limit: limit.toString(), next: firstPageCursor },
        } as never);

        // THEN expect the handler to call the service to get the occupations
        expect(getServiceRegistry().occupation.findPaginated).toHaveBeenCalled();
        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to retrieve the occupations from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET should respond with the INTERNAL_SERVER_ERROR status code if decodeCursor throws an error", async () => {
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // WHEN the occupation handler is invoked with invalid cursor
        const actualResponse = await occupationHandler({
          ...givenEvent,
          queryStringParameters: { cursor: "invalid_cursor" },
        } as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_NEXT_CURSOR,
          message: "Failed to decode the cursor provided in the query parameter",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET should respond with NOT_FOUND if the model does not exist", async () => {
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // AND the model does not exist
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModalForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the NOT_FOUND status
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.MODEL_NOT_FOUND,
          message: "Model not found",
          details: `No model found with id: ${givenModelId}`,
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET should respond with INTERNAL_SERVER_ERROR if failed to fetch model details from DB", async () => {
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // AND failed to fetch model details
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModalForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to fetch the model details from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations (paginated) should respond with INTERNAL_SERVER_ERROR if failed to fetch model details from DB", async () => {
        // AND role check passes for anonymous access
        checkRole.mockReturnValueOnce(true);

        // AND failed to fetch model details
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModalForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to fetch the model details from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      testMethodsNotAllowed(
        [HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH],
        occupationHandler
      );
    });
  });
});
