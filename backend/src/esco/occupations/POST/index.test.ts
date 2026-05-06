import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "../_shared/transform";
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
import { IOccupation } from "../_shared/occupation.types";
import { getIOccupationMockData } from "../_shared/testDataHelper";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  IOccupationService,
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { IModelInfoDoc } from "modelInfo/modelInfo.types";
import mongoose from "mongoose";

import {
  testRequestJSONMalformed,
  testRequestJSONSchema,
  testTooLargePayload,
  testUnsupportedMediaType,
} from "_test_utilities/stdRESTHandlerTests";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformSpy = jest.spyOn(transformModule, "transform");

// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation POST handler", () => {
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
        } as unknown as APIGatewayProxyEvent;

        // WHEN the handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent);

        // THEN expect the handler to respond with the FORBIDDEN status
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("POST should response with the CREATED status code and the newly created occupation for a valid and max size payload", async () => {
      // GIVEN a valid request (method & header & payload)
      const givenModelId = getMockStringId(1);

      const givenPayload: OccupationAPISpecs.POST.Types.Request.Payload = {
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
      } as unknown as APIGatewayProxyEvent;

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
      } as unknown as APIGatewayProxyEvent;

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
      } as unknown as APIGatewayProxyEvent;

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
        Model: undefined as unknown as mongoose.Model<IModelInfoDoc>,
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
        errorCode: OccupationAPISpecs.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
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
      } as unknown as APIGatewayProxyEvent;
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
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("POST should respond with REQUEST_TOO_LONG when payload is too large", async () => {
      const givenModelId = getMockStringId(1);
      const largePayload = "x".repeat(OccupationAPISpecs.POST.Constants.MAX_POST_PAYLOAD_LENGTH + 1);
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: largePayload,
        headers: { "Content-Type": "application/json" },
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as unknown as APIGatewayProxyEvent;
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
      } as unknown as APIGatewayProxyEvent;
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
      } as unknown as APIGatewayProxyEvent;
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
      expect(body.errorCode).toEqual(OccupationAPISpecs.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND);
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
      } as unknown as APIGatewayProxyEvent;
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
        OccupationAPISpecs.POST.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL
      );
      expect(body.message).toEqual("Cannot add occupations to a released model");
    });

    test("POST should respond with BAD_REQUEST if JSON.parse throws a non-Error", async () => {
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
        path: `/models/${getMockStringId(1)}/occupations`,
        pathParameters: { modelId: getMockStringId(1) },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);

      const jsonParseSpy = jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
        throw "not an error object";
      });

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.details).toEqual("Unknown error");

      jsonParseSpy.mockRestore();
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
      } as unknown as APIGatewayProxyEvent;
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
      } as unknown as APIGatewayProxyEvent;
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
    testTooLargePayload(HTTP_VERBS.POST, OccupationAPISpecs.POST.Constants.MAX_POST_PAYLOAD_LENGTH, occupationHandler);

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
      } as unknown as APIGatewayProxyEvent;

      // AND the user does not have the required role
      checkRole.mockResolvedValue(false);

      // WHEN the occupation handler is invoked with the given event
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect the handler to return the FORBIDDEN status
      expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });
  });
});
