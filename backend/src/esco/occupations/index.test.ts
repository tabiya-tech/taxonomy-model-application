import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "./transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as occupationHandler, OccupationController } from "./index";
import { HTTP_VERBS, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import { randomUUID } from "node:crypto";
import ErrorAPISpecs from "api-specifications/error";
import { getRandomString } from "_test_utilities/getMockRandomData";
import OccupationAPISpecs from "api-specifications/esco/occupation";

import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupation, IOccupationWithoutImportId } from "./occupation.types";
import { IOccupationGroup } from "../occupationGroup/OccupationGroup.types";
import * as transformOccupationGroupModule from "../occupationGroup/transform";
import { getIOccupationMockData } from "./testDataHelper";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  IOccupationService,
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "./occupationService.types";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
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
checkRole.mockResolvedValue(true);

const transformSpy = jest.spyOn(transformModule, "transform");
const transformPaginatedSpy = jest.spyOn(transformModule, "transformPaginated");
const transformDynamicEntitySpy = jest.spyOn(transformModule, "transformDynamicEntity");
const transformOccupationGroupSpy = jest.spyOn(transformOccupationGroupModule, "transform");

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
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupation: jest.fn(),

        getParent: jest.fn().mockResolvedValue(null),
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
        code: getMockRandomOccupationCode(false),
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
      checkRole.mockResolvedValue(true);

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND the service that will successfully create the occupation
      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        create: jest.fn().mockResolvedValue(givenOccupation),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupation: jest.fn(),

        getParent: jest.fn(),
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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

    test("POST should respond with CREATED when occupation type is LOCAL", async () => {
      // GIVEN a valid request with LocalOccupation
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: "1234_1",
        occupationType: OccupationAPISpecs.Enums.OccupationType.LocalOccupation,
        preferredLabel: "Local Occupation",
        description: "description",
        altLabels: [],
        originUri: `http://some/path/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: "1234L",
        definition: "definition",
        scopeNote: "scopeNote",
        regulatedProfessionNote: "regulatedProfessionNote",
        isLocalized: true,
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      const givenOccupation = getIOccupationMockData(2);
      givenOccupation.occupationType = ObjectTypes.LocalOccupation;
      const givenOccupationServiceMock = {
        create: jest.fn().mockResolvedValue(givenOccupation),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),

        getParent: jest.fn(),
        getChildren: jest.fn(),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN calling the handler
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect respond with CREATED
      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);

      // AND expect the handler to call the service with LocalOccupation
      expect(givenOccupationServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ occupationType: ObjectTypes.LocalOccupation })
      );
    });
    test("POST should respond with the INTERNAL_SERVER_ERROR status code if the repository failed to create the occupation", async () => {
      // GIVEN a valid request {method & header & payload}
      const givenModelId = getMockStringId(1);

      const givenPayload = {
        modelId: givenModelId,
        code: getMockRandomOccupationCode(false),
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
      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = {
        create: jest.fn().mockRejectedValue(new Error("foo")),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupation: jest.fn(),
        getParent: jest.fn(),
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
        errorCode: OccupationAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
        message: "Failed to create the occupation in the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("POST should respond with BAD_REQUEST when modelId in path is missing", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: getMockRandomOccupationCode(false),
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
      checkRole.mockResolvedValue(true);
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("POST should respond with BAD_REQUEST when modelId in payload doesn't match path", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: getMockStringId(2),
        code: getMockRandomOccupationCode(false),
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
      checkRole.mockResolvedValue(true);
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
      checkRole.mockResolvedValue(true);
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
      checkRole.mockResolvedValue(true);
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST); // Request body is empty
    });

    test("POST should respond with NOT_FOUND when model doesn't exist", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: getMockRandomOccupationCode(false),
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
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
          ),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
        getParent: jest.fn(),
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      } as IOccupationService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupation = givenOccupationServiceMock;
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.Enums.POST.Response.Status404.ErrorCodes.MODEL_NOT_FOUND);
      expect(body.message).toEqual("Model not found by the provided ID");
    });

    test("POST should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: getMockRandomOccupationCode(false),
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
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED)
          ),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
        getParent: jest.fn(),
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      } as IOccupationService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupation = givenOccupationServiceMock;
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Enums.POST.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL
      );
      expect(body.message).toEqual("Cannot add occupations to a released model");
    });

    test("POST should respond with BAD_REQUEST if parseJSON throws an Error", async () => {
      const givenThrownError = new Error("an error");
      const parseSpy = jest
        .spyOn(OccupationController.prototype, "parseJSON" as keyof OccupationController)
        .mockImplementation(() => {
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
        checkRole.mockResolvedValue(true);
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

    test("POST should respond with BAD_REQUEST if JSON.parse throws an error", async () => {
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: "{invalid json", // Invalid JSON that will cause JSON.parse to throw
        headers: { "Content-Type": "application/json" },
        path: `/models/${getMockStringId(1)}/occupations`,
        pathParameters: { modelId: getMockStringId(1) },
      } as never;
      checkRole.mockResolvedValue(true);
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY);
      expect(body.message).toEqual(ErrorAPISpecs.Constants.ReasonPhrases.MALFORMED_BODY);
      expect(body.details).toBeDefined(); // Should contain the JSON parse error message
    });

    test("POST should handle non-Error exceptions in JSON parsing", async () => {
      // GIVEN a controller with mocked parseJSON method that throws a string
      const occupationController = new OccupationController();
      const parseSpy = jest
        .spyOn(occupationController, "parseJSON" as keyof OccupationController)
        .mockImplementation(() => {
          throw "String error"; // Throw a string, not an Error object
        });

      try {
        const givenEvent = {
          httpMethod: HTTP_VERBS.POST,
          body: "any body", // Body doesn't matter since parseJSON is mocked
          headers: { "Content-Type": "application/json" },
          path: `/models/${getMockStringId(1)}/occupations`,
          pathParameters: { modelId: getMockStringId(1) },
        } as never;
        checkRole.mockResolvedValue(true);

        // WHEN the controller method is invoked directly
        const actualResponse = await occupationController.postOccupation(givenEvent);

        // THEN expect BAD_REQUEST with "Unknown error" details
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY);
        expect(body.message).toEqual(ErrorAPISpecs.Constants.ReasonPhrases.MALFORMED_BODY);
        expect(body.details).toEqual("Unknown error"); // Should use the fallback
      } finally {
        parseSpy.mockRestore();
      }
    });

    test("POST should respond with INTERNAL_SERVER_ERROR when failed to fetch model details from DB", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: getMockRandomOccupationCode(false),
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
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB)
          ),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
        getParent: jest.fn(),
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      } as IOccupationService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupation = givenOccupationServiceMock;
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual("DB_FAILED_TO_CREATE_OCCUPATION");
      expect(body.message).toEqual("Failed to fetch the model details from the DB");
    });

    test("POST should respond with INTERNAL_SERVER_ERROR for unknown validation error code", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId,
        code: getMockRandomOccupationCode(false),
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
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(new OccupationModelValidationError(3 as ModelForOccupationValidationErrorCode)),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
        getParent: jest.fn(),
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      } as IOccupationService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupation = givenOccupationServiceMock;
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual("DB_FAILED_TO_CREATE_OCCUPATION");
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
        code: getMockRandomOccupationCode(false),
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
      checkRole.mockResolvedValue(false);

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
        checkRole.mockResolvedValueOnce(true);

        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
        checkRole.mockResolvedValueOnce(true);

        // AND the model does not exist
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
          getParent: jest.fn(),
          getChildren: jest.fn(),
          getSkills: jest.fn(),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the NOT_FOUND status
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          message: "Model not found",
          details: `No model found with id: ${givenModelId}`,
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations/{id} should respond with INTERNAL_SERVER_ERROR if failed to fetch model details from DB", async () => {
        // GIVEN role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        // AND failed to fetch model details
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
          getParent: jest.fn(),
          getChildren: jest.fn(),
          getSkills: jest.fn(),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to fetch the model details from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations/{id} should respond with NOT_FOUND if the occupation does not exist", async () => {
        // GIVEN a service that returns null for the occupation
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn(),
          getSkills: jest.fn(),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the NOT_FOUND status
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          message: "occupation not found",
          details: `No occupation found with id: ${givenId}`,
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if modelId is missing", async () => {
        const givenSkillGroupId = getMockStringId(2);

        const givenEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          pathParameters: { id: givenSkillGroupId.toString() },
          queryStringParameters: {},
          path: `/models//occupations/${givenSkillGroupId}`,
        } as never;

        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedMissing = JSON.parse(actualResponse.body);
        expect(parsedMissing).toMatchObject({
          errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          message: "Route did not match",
        });
        expect(typeof parsedMissing.details).toBe("string");
      });

      test("GET /occupations/{id} should extract modelId from path when pathParameters.modelId is not set", async () => {
        // GIVEN a service that will successfully get the occupation
        const givenOccupation: IOccupation = getIOccupationMockData();

        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
        checkRole.mockResolvedValueOnce(true);

        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
        checkRole.mockResolvedValueOnce(true);

        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
          path: `/models/${givenModelId}/occupations/invalid-id`, // invalid id format
          pathParameters: { modelId: givenModelId, id: "invalid-id" },
          queryStringParameters: {},
        };

        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenBadEvent as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedMissing = JSON.parse(actualResponse.body);
        expect(parsedMissing).toMatchObject({
          errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
        });
        expect(typeof parsedMissing.details).toBe("string");
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if modelId is invalid", async () => {
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/invalid-id/occupations/${givenId}`, // invalid modelId format
          pathParameters: { modelId: "invalid-id", id: givenId },
          queryStringParameters: {},
        };

        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

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
        checkRole.mockResolvedValueOnce(true);
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn().mockRejectedValue(new Error("foo")),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to retrieve the occupation from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if path doesn't match route pattern", async () => {
        // Use a path that doesn't match the OCCUPATION_ROUTE pattern
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/invalid/path/structure`, // Doesn't match any route
          pathParameters: { modelId: getMockStringId(1) },
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("Route did not match");
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if modelId is invalid", async () => {
        // Use an invalid modelId that will fail validation
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/invalid-id/occupations/${getMockStringId(2)}`,
          pathParameters: { modelId: "invalid-id", id: getMockStringId(2) },
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe(ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA);
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if id is not a valid MongoDB ObjectId", async () => {
        // Use an invalid id that will fail validation
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${getMockStringId(1)}/occupations/invalid-id`,
          pathParameters: { modelId: getMockStringId(1), id: "invalid-id" },
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe(ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA);
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
      });

      test("GET /occupations/{id} should handle catch block non-Error exceptions", async () => {
        // GIVEN a service that will throw an exception
        checkRole.mockResolvedValueOnce(true);
        const givenOccupationServiceMock = {
          findById: jest.fn().mockRejectedValue("non-error exception"),
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getOccupationById directly
        const actualResponse = await occupationController.getOccupationById({
          path: `/models/${getMockStringId(1)}/occupations/${getMockStringId(2)}`,
          pathParameters: { modelId: getMockStringId(1), id: getMockStringId(2) },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      });

      test("GET /occupations/{id} should handle when regex match fails", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        const occupationController = new OccupationController();
        // AND pathToMatch that won't match
        const actualResponse = await occupationController.getOccupationById({
          path: "/invalid/path",
          pathParameters: undefined,
        } as unknown as APIGatewayProxyEvent);
        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });
    });

    describe("GET /occupations (paginated)", () => {
      // GIVEN a valid GET request (method & header)
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId.toString() },
        queryStringParameters: {},
      };

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);

      test("GET should return only the occupations for the given modelId", async () => {
        // AND GIVEN a service that will successfully get an arbitrary number (N) of models
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);
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
        checkRole.mockResolvedValueOnce(true);

        // AND a service that will successfully get the limited occupations
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn().mockResolvedValue({ items: firstPageOccupations, nextCursor: null }),
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
        checkRole.mockResolvedValueOnce(true);

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
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
        checkRole.mockResolvedValueOnce(true);
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
          errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          message: "Route did not match",
        });
        expect(typeof parsedMissing.details).toBe("string");
      });
      test("GET should respond with the BAD_REQUEST status code if the modelId is not correct model id", async () => {
        // AND GIVEN the repository fails to get the occupations
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);
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
          message: "Route did not match",
        });
        expect(typeof parsedInvalidModel.details).toBe("string");
      });
      test("GET should respond with the BAD_REQUEST status code if the query parameter is not valid query parameter", async () => {
        // AND GIVEN the repository fails to get the occupations
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);
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
          errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
          message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
        });
        expect(typeof parsedInvalidQuery.details).toBe("string");
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if modelId is missing from path and pathParameters", async () => {
        // Path does NOT include /models/{modelId} at all
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);
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
        expect(body.message).toBe("Route did not match");
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if modelId is invalid", async () => {
        // Use an invalid modelId that will fail validation
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: "/models/invalid-model-id/occupations",
          pathParameters: { modelId: "invalid-model-id" },
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

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
        checkRole.mockResolvedValueOnce(true);

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe(ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA);
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER);
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
        checkRole.mockResolvedValueOnce(true);

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
        checkRole.mockResolvedValueOnce(true);

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe(ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA);
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER);
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
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as IOccupationService;

        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

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
          limit: OccupationAPISpecs.Constants.DEFAULT_LIMIT,
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
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;
        const limit = 2;

        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

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
          errorCode: OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to retrieve the occupations from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET should respond with the BAD_REQUEST status code if decodeCursor throws an error", async () => {
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        // WHEN the occupation handler is invoked with invalid cursor
        const actualResponse = await occupationHandler({
          ...givenEvent,
          queryStringParameters: { cursor: "invalid_cursor" },
        } as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
          message: "Invalid cursor parameter",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET should respond with NOT_FOUND if the model does not exist", async () => {
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        // AND the model does not exist
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
          getParent: jest.fn(),
          getChildren: jest.fn(),
          getSkills: jest.fn(),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the NOT_FOUND status
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          message: "Model not found",
          details: `No model found with id: ${givenModelId}`,
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET should respond with INTERNAL_SERVER_ERROR if failed to fetch model details from DB", async () => {
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        // AND failed to fetch model details
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
          getParent: jest.fn(),
          getChildren: jest.fn(),
          getSkills: jest.fn(),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to fetch the model details from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations (paginated) should respond with INTERNAL_SERVER_ERROR if failed to fetch model details from DB", async () => {
        // AND role check passes for anonymous access
        checkRole.mockResolvedValueOnce(true);

        // AND failed to fetch model details
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
          getParent: jest.fn(),
          getChildren: jest.fn(),
          getSkills: jest.fn(),
        } as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to fetch the model details from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations (paginated) should handle catch block non-Error exceptions", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        const givenOccupationServiceMock = {
          findPaginated: jest.fn().mockRejectedValue("non-error exception"),
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getOccupations directly
        const actualResponse = await occupationController.getOccupations({
          path: `/models/${getMockStringId(1)}/occupations`,
          pathParameters: { modelId: getMockStringId(1) },
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if modelId is empty in matched path", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        const occupationController = new OccupationController();

        // WHEN calling getOccupations with a path where modelId is empty (e.g. //occupations)
        // AND the route still matches the regex (which it would for /models//occupations)
        const actualResponse = await occupationController.getOccupations({
          path: "/models//occupations",
          pathParameters: {},
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        expect(JSON.parse(actualResponse.body).message).toBe("Route did not match");
      });

      test("GET /occupations (paginated) should handle null queryStringParameters", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        const occupationController = new OccupationController();
        const givenOccupationServiceMock = {
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn(),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling getOccupations with null queryParams
        const actualResponse = await occupationController.getOccupations({
          path: `/models/${getMockStringId(1)}/occupations`,
          pathParameters: { modelId: getMockStringId(1) },
          queryStringParameters: null,
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      });
    });

    describe("GET /occupations/{id}/parent", () => {
      const givenModelId = getMockStringId(1);
      const givenId = getMockStringId(2);

      test("should return BAD_REQUEST when path parameters are invalid", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const occupationController = new OccupationController();

        // WHEN calling getParent with invalid modelId
        const actualResponse = await occupationController.getParent({
          path: `/models/invalid/occupations/${givenId}/parent`,
          pathParameters: { modelId: "invalid", id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        expect(JSON.parse(actualResponse.body).message).toBe(ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA);
      });
      test("should return NOT_FOUND when occupation doesn't exist", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND the service returns MODEL_NOT_FOUND_BY_ID
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue(null),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getParent
        const actualResponse = await occupationController.getParent({
          path: `/models/${givenModelId}/occupations/${givenId}/parent`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect NOT_FOUND
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_NOT_FOUND);
      });

      test("should return NOT_FOUND when model doesn't exist", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND the service returns MODEL_NOT_FOUND_BY_ID
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getParent
        const actualResponse = await occupationController.getParent({
          path: `/models/${givenModelId}/occupations/${givenId}/parent`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect NOT_FOUND
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND);
      });

      test("should return INTERNAL_SERVER_ERROR when model fetch fails", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND the service returns FAILED_TO_FETCH_FROM_DB
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
          getParent: jest.fn(),
          getChildren: jest.fn(),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getParent
        const actualResponse = await occupationController.getParent({
          path: `/models/${givenModelId}/occupations/${givenId}/parent`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      });

      test("should handle errors when getParent fails", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND the service throws an error
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getParent: jest.fn().mockRejectedValue(new Error("Database error")),
          getChildren: jest.fn(),
          getSkills: jest.fn(),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getParent
        const actualResponse = await occupationController.getParent({
          path: `/models/${givenModelId}/occupations/${givenId}/parent`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toBe(
          OccupationAPISpecs.Enums.GET.Response.Status500.Parent.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_PARENT
        );
      });

      test("should handle non-error exceptions when getParent fails", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const givenId = getMockStringId(1);
        const givenModelId = getMockStringId(2);
        mockGetServiceRegistry().occupation.validateModelForOccupation = jest.fn().mockResolvedValue(null);
        mockGetServiceRegistry().occupation.findById = jest.fn().mockResolvedValue({ id: givenId });

        // AND the service fails with a non-error
        mockGetServiceRegistry().occupation.getParent = jest.fn().mockRejectedValue("non-error exception");

        const occupationController = new OccupationController();

        // WHEN calling getParent
        const actualResponse = await occupationController.getParent({
          path: `/models/${givenModelId}/occupations/${givenId}/parent`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("Failed to retrieve the occupation parent from the DB");
      });

      test("should fallback to path if pathParameters are missing", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const givenId = getMockStringId(1);
        const givenModelId = getMockStringId(2);
        mockGetServiceRegistry().occupation.validateModelForOccupation = jest.fn().mockResolvedValue(null);
        mockGetServiceRegistry().occupation.findById = jest.fn().mockResolvedValue({ id: givenId });

        // AND the service returns parents
        const mockParent = getIOccupationMockData(3);
        mockParent.modelId = givenModelId; // Ensure modelId matches for validation
        mockGetServiceRegistry().occupation.getParent = jest.fn().mockResolvedValue(mockParent);

        const occupationController = new OccupationController();

        // WHEN calling getParent WITHOUT pathParameters
        const actualResponse = await occupationController.getParent({
          path: `/models/${givenModelId}/occupations/${givenId}/parent`,
          // pathParameters is missing
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        // AND expect the service to have been called with IDs from the path
        expect(mockGetServiceRegistry().occupation.getParent).toHaveBeenCalledWith(givenModelId, givenId);
        // AND the response to contain the transformed parent
        expect(transformDynamicEntitySpy).toHaveBeenCalledWith(mockParent, config.getResourcesBaseUrl());
      });

      test("should return BAD_REQUEST if path is missing but pathParameters are present", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const givenId = getMockStringId(1);
        const givenModelId = getMockStringId(2);
        mockGetServiceRegistry().occupation.validateModelForOccupation = jest.fn().mockResolvedValue(null);

        const occupationController = new OccupationController();

        // WHEN calling getParent with missing path but present pathParameters
        const actualResponse = await occupationController.getParent({
          pathParameters: { modelId: givenModelId, id: givenId },
          // path is missing
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST with "Route did not match" because path is empty
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        expect(JSON.parse(actualResponse.body).message).toBe("Route did not match");
      });

      test("should return BAD_REQUEST if BOTH pathParameters and path are missing", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const occupationController = new OccupationController();

        // WHEN calling getParent without pathParameters AND without path
        const actualResponse = await occupationController.getParent({
          // path is missing
          // pathParameters is missing
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST with "Route did not match" because path is empty
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        expect(JSON.parse(actualResponse.body).message).toBe("Route did not match");
      });

      test("should return OccupationGroup parent correctly transformed", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const givenId = getMockStringId(1);
        const givenModelId = getMockStringId(2);
        mockGetServiceRegistry().occupation.validateModelForOccupation = jest.fn().mockResolvedValue(null);

        // AND the service returns an OccupationGroup parent
        const mockParentGroup: IOccupationGroup = {
          // ... minimal mock of IOccupationGroup
          id: getMockStringId(3),
          modelId: givenModelId,
          groupType: ObjectTypes.ISCOGroup,
          code: "1234",
          preferredLabel: "Group",
          altLabels: [],
          description: "Desc",
          children: [],
          parent: null,
          UUID: randomUUID(),
          UUIDHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          originUri: "uri",
          importId: "importId",
        };
        mockGetServiceRegistry().occupation.getParent = jest.fn().mockResolvedValue(mockParentGroup);
        mockGetServiceRegistry().occupation.findById = jest.fn().mockResolvedValue({ id: givenId });

        const occupationController = new OccupationController();

        // WHEN calling getParent
        const actualResponse = await occupationController.getParent({
          path: `/models/${givenModelId}/occupations/${givenId}/parent`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        // AND transformOccupationGroup to be called
        expect(transformOccupationGroupSpy).toHaveBeenCalledWith(mockParentGroup, config.getResourcesBaseUrl());
      });
    });

    describe("GET /occupations/{id}/children", () => {
      const givenModelId = getMockStringId(1);
      const givenId = getMockStringId(2);

      test("should return BAD_REQUEST when path parameters are invalid", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const occupationController = new OccupationController();

        // WHEN calling getChildren with invalid modelId
        const actualResponse = await occupationController.getChildren({
          path: `/models/invalid/occupations/${givenId}/children`,
          pathParameters: { modelId: "invalid", id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });
      test("should return NOT_FOUND when occupation doesn't exist", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND the service returns MODEL_NOT_FOUND_BY_ID
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue(null),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getChildren
        const actualResponse = await occupationController.getChildren({
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect NOT_FOUND
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_NOT_FOUND);
      });

      test("should return NOT_FOUND when model doesn't exist", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND the service returns MODEL_NOT_FOUND_BY_ID
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getChildren
        const actualResponse = await occupationController.getChildren({
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect NOT_FOUND
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND);
      });

      test("should return INTERNAL_SERVER_ERROR when model fetch fails", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND the service returns FAILED_TO_FETCH_FROM_DB
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
          getParent: jest.fn(),
          getChildren: jest.fn(),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getChildren
        const actualResponse = await occupationController.getChildren({
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      });

      test("should return BAD_REQUEST when query parameters are invalid", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const occupationController = new OccupationController();

        // WHEN calling getChildren with invalid query parameter (limit)
        const actualResponse = await occupationController.getChildren({
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          pathParameters: { modelId: givenModelId, id: givenId },
          queryStringParameters: { limit: "invalid" },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });

      test("should return BAD_REQUEST when cursor is invalid", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND a service mock
        const givenOccupationServiceMock = {
          create: jest.fn(),
          findById: jest.fn(),
          findPaginated: jest.fn(),
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          getParent: jest.fn(),
          getChildren: jest.fn(),
          getSkills: jest.fn(),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getChildren with an invalid cursor
        const actualResponse = await occupationController.getChildren({
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          pathParameters: { modelId: givenModelId, id: givenId },
          queryStringParameters: { cursor: "invalid-cursor-format-not-base64" },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER);
        expect(body.message).toBe("Invalid cursor parameter");
      });

      test("should handle errors when getChildren fails", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND the service throws an error
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getParent: jest.fn(),
          getChildren: jest.fn().mockRejectedValue(new Error("Database error")),
          getSkills: jest.fn(),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getChildren
        const actualResponse = await occupationController.getChildren({
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          pathParameters: { modelId: givenModelId, id: givenId },
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toBe(
          OccupationAPISpecs.Enums.GET.Response.Status500.Children.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_CHILDREN
        );
        expect(body.message).toBe("Failed to retrieve the occupation children from the DB");
      });

      test("should encode nextCursor when children have more results", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND the service returns children with nextCursor
        const mockChild = getIOccupationMockData(3);
        mockChild.modelId = givenModelId;

        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getParent: jest.fn(),
          getChildren: jest.fn().mockResolvedValue({
            items: [mockChild],
            nextCursor: { _id: getMockStringId(4), createdAt: new Date() },
          }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getChildren
        const actualResponse = await occupationController.getChildren({
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          pathParameters: { modelId: givenModelId, id: givenId },
          queryStringParameters: { limit: "10" },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK with nextCursor encoded
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        const body = JSON.parse(actualResponse.body);
        expect(body.nextCursor).toBeDefined();
        expect(typeof body.nextCursor).toBe("string");
      });

      test("should use valid cursor correctly", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // AND a valid cursor
        const givenCursor = Buffer.from(JSON.stringify({ id: "someId", createdAt: new Date().toISOString() })).toString(
          "base64"
        );

        // AND the service returns children
        const mockChild = getIOccupationMockData(3);
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getChildren: jest.fn().mockResolvedValue({
            items: [mockChild],
            nextCursor: null,
          }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        const occupationController = new OccupationController();

        // WHEN calling getChildren with a valid cursor
        const actualResponse = await occupationController.getChildren({
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          pathParameters: { modelId: givenModelId, id: givenId },
          queryStringParameters: { cursor: givenCursor },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        // AND expect the service to be called with the decoded cursor id
        expect(mockGetServiceRegistry().occupation.getChildren).toHaveBeenCalledWith(
          givenModelId,
          givenId,
          "someId",
          OccupationAPISpecs.Constants.DEFAULT_LIMIT
        );
        // AND the response to contain transformed objects
        const actualBody = JSON.parse(actualResponse.body);
        expect(actualBody.data).toEqual([transformModule.transform(mockChild, config.getResourcesBaseUrl())]);
      });

      test("should handle non-error exceptions when getChildren fails", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const givenId = getMockStringId(1);
        const givenModelId = getMockStringId(2);
        mockGetServiceRegistry().occupation.validateModelForOccupation = jest.fn().mockResolvedValue(null);
        mockGetServiceRegistry().occupation.findById = jest.fn().mockResolvedValue({ id: givenId });

        // AND the service fails with a non-error
        mockGetServiceRegistry().occupation.getChildren = jest.fn().mockRejectedValue("non-error exception");

        const occupationController = new OccupationController();

        // WHEN calling getChildren
        const actualResponse = await occupationController.getChildren({
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("Failed to retrieve the occupation children from the DB");
      });

      test("should fallback to path if pathParameters are missing", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const givenId = getMockStringId(1);
        const givenModelId = getMockStringId(2);
        mockGetServiceRegistry().occupation.validateModelForOccupation = jest.fn().mockResolvedValue(null);
        mockGetServiceRegistry().occupation.findById = jest.fn().mockResolvedValue({ id: givenId });

        // AND the service returns children
        mockGetServiceRegistry().occupation.getChildren = jest.fn().mockResolvedValue({ items: [], nextCursor: null });

        const occupationController = new OccupationController();

        // WHEN calling getChildren WITHOUT pathParameters
        const actualResponse = await occupationController.getChildren({
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          // pathParameters is missing
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        // AND expect the service to have been called with IDs from the path
        expect(mockGetServiceRegistry().occupation.getChildren).toHaveBeenCalledWith(
          givenModelId,
          givenId,
          undefined, // no cursor
          OccupationAPISpecs.Constants.DEFAULT_LIMIT
        );
      });

      test("should return BAD_REQUEST if BOTH pathParameters and path are missing", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const occupationController = new OccupationController();

        // WHEN calling getChildren without pathParameters AND without path
        const actualResponse = await occupationController.getChildren({
          // path is missing
          // pathParameters is missing
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });

      test("should return BAD_REQUEST if path is missing but present pathParameters", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const givenId = getMockStringId(1);
        const givenModelId = getMockStringId(2);
        mockGetServiceRegistry().occupation.validateModelForOccupation = jest.fn().mockResolvedValue(null);

        const occupationController = new OccupationController();

        // WHEN calling getChildren with missing path but present pathParameters
        const actualResponse = await occupationController.getChildren({
          pathParameters: { modelId: givenModelId, id: givenId },
          // path is missing
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });
      test("should return METHOD_NOT_ALLOWED if event is null", async () => {
        // WHEN calling handler with null
        const actualResponse = await occupationHandler(null as unknown as APIGatewayProxyEvent);

        // THEN expect METHOD_NOT_ALLOWED
        expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
      });

      test("should handle missing path in handler", async () => {
        // GIVEN GET request without path
        const event = {
          httpMethod: HTTP_VERBS.GET,
          // path is missing
        } as unknown as APIGatewayProxyEvent;

        // WHEN calling handler
        const actualResponse = await occupationHandler(event);

        // THEN expect it to route to getOccupations (default)
        // (Note: getOccupations will fail later due to missing modelId, but we're testing the routing branch here)
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });
    });

    describe("Handler Routing", () => {
      const givenModelId = getMockStringId(1);
      const givenId = getMockStringId(2);

      test("should route to getParent", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getParent: jest.fn().mockResolvedValue(null),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler with parent route
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/parent`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      });

      test("should route to getChildren", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler with children route
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/children`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      });

      test("should route to getSkills", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler with skills route
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      });
    });

    describe("getSkills", () => {
      const givenModelId = getMockStringId(1);
      const givenId = getMockStringId(2);

      test("should return 200 and paginated skills", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND model validation passes
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getSkills: jest.fn().mockResolvedValue({
            items: [
              {
                id: getMockStringId(3),
                UUID: randomUUID(),
                preferredLabel: "skill_1",
                createdAt: new Date(),
                updatedAt: new Date(),
                relationType: OccupationToSkillRelationType.ESSENTIAL,
                signallingValue: null,
                signallingValueLabel: "",
                parents: [],
                children: [],
                requiresSkills: [],
                requiredBySkills: [],
                requiredByOccupations: [],
              },
            ],
            nextCursor: { _id: getMockStringId(3), createdAt: new Date() },
          }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenId },
          queryStringParameters: { limit: "10" },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        const body = JSON.parse(actualResponse.body);
        expect(body.data).toHaveLength(1);
        expect(body.limit).toEqual(10);
        expect(body.nextCursor).toBeDefined();
      });

      test("should return 400 for invalid path parameters", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // WHEN calling the handler with invalid id
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/invalid-id/skills`,
          pathParameters: { modelId: givenModelId, id: "invalid-id" },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });

      test("should return 400 for invalid query parameters", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // WHEN calling the handler with invalid limit
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenId },
          queryStringParameters: { limit: "foo" },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });

      test("should return 400 for invalid cursor", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // WHEN calling the handler with invalid cursor
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenId },
          queryStringParameters: { cursor: "invalid-base64" },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });

      test("should return 404 if model is not found", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND model validation fails
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect NOT_FOUND
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      });

      test("should return 404 if occupation is not found", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND model validation passes
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue(null),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect NOT_FOUND
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_NOT_FOUND);
      });

      test("should return 500 if failing to fetch model from DB", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND model validation fails
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
          findById: jest.fn(),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      });

      test("should return 200 when pathParameters are missing but path is provide", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND model validation passes
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getSkills: jest.fn().mockResolvedValue({
            items: [],
            nextCursor: null,
          }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler with MISSING pathParameters
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          // pathParameters: { modelId: givenModelId, id: givenId }, // MISSING
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      });

      test("should return 500 if service throws an unknown error", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND service throws
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getSkills: jest.fn().mockRejectedValue("Unknown error"),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      });

      test("should return 400 when both pathParameters and path are missing", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // WHEN calling the handler with MISSING pathParameters and path
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: "",
          pathParameters: {},
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        expect(JSON.parse(actualResponse.body).message).toBe("Route did not match");
      });

      test("should return 400 when pathParameters are missing and path does not match", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // WHEN calling the handler with MISSING pathParameters and non-matching path
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: "/invalid/path",
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        expect(JSON.parse(actualResponse.body).message).toBe("Route did not match");
      });

      test("should return 400 when pathParameters is null and path is empty string", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // WHEN calling the handler with NULL pathParameters and EMPTY path
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          pathParameters: null,
          path: "",
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });

      test("should return 200 when only modelId is in pathParameters", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND model validation passes
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler with only modelId in pathParameters
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      });

      test("should return 200 when only id is in pathParameters but path provides everything", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND model validation passes
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler with only id in pathParameters
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      });

      test("should return 400 when pathParameters is an empty object and path is missing", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // WHEN calling the handler with EMPTY pathParameters and MISSING path
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          pathParameters: {},
          path: "",
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });

      test("should return 400 when path is explicitly null", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // WHEN calling the handler with NULL path
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: null as never,
          pathParameters: null as never,
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        expect(JSON.parse(actualResponse.body).message).toBe("Route did not match");
      });

      test("should return 400 when pathParameters are provided but path does not match regex", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);

        // WHEN calling the handler with provided pathParameters but non-matching path
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: "/random/path",
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        expect(JSON.parse(actualResponse.body).message).toBe("Route did not match");
      });

      test("should return 200 when pathParameters has null values", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND model validation passes
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler with pathParameters containing NULL values
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: null, id: null } as unknown as APIGatewayProxyEvent["pathParameters"],
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      });

      test("should return 400 when only modelId is provided and path is empty", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND a controller instance
        const controller = new OccupationController();

        // WHEN calling the method DIRECTLY with only modelId in pathParameters and empty path
        const actualResponse = await controller.getSkills({
          httpMethod: HTTP_VERBS.GET,
          pathParameters: { modelId: givenModelId },
          path: "",
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST (since id will be empty)
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });

      test("should return 400 when only id is provided and path is empty", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND a controller instance
        const controller = new OccupationController();

        // WHEN calling the method DIRECTLY with only id in pathParameters and empty path
        const actualResponse = await controller.getSkills({
          httpMethod: HTTP_VERBS.GET,
          pathParameters: { id: givenId },
          path: "",
        } as unknown as APIGatewayProxyEvent);

        // THEN expect BAD_REQUEST (since modelId will be empty)
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      });

      test("should return 200 when nextCursor is missing _id", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND model validation passes
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getSkills: jest.fn().mockResolvedValue({
            items: [],
            nextCursor: { createdAt: new Date() } as unknown as { _id: string; createdAt: Date },
          }),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      });

      test("should return 500 if service throws", async () => {
        // GIVEN role check passes
        checkRole.mockResolvedValueOnce(true);
        // AND service throws
        const givenOccupationServiceMock = {
          validateModelForOccupation: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue({ id: givenId }),
          getSkills: jest.fn().mockRejectedValue(new Error("Service failure")),
        } as unknown as IOccupationService;
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.occupation = givenOccupationServiceMock;

        // WHEN calling the handler
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          path: `/models/${givenModelId}/occupations/${givenId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenId },
        } as unknown as APIGatewayProxyEvent);

        // THEN expect INTERNAL_SERVER_ERROR
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        const body = JSON.parse(actualResponse.body);
        expect(body.errorCode).toBe(
          OccupationAPISpecs.Enums.GET.Response.Status500.Skills.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_SKILLS
        );
      });
    });
  });

  testMethodsNotAllowed([HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH], occupationHandler);
});
