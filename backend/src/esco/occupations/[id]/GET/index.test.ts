import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "../../_shared/transform";
import { handler as occupationHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import * as authenticatorModule from "auth/authorizer";
import { IOccupation } from "../../_shared/occupation.types";
import { getIOccupationMockData } from "../../_shared/testDataHelper";
import { IOccupationService, ModelForOccupationValidationErrorCode } from "../../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformSpy = jest.spyOn(transformModule, "transform");

// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation Detail GET handler", () => {
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
        update: jest.fn(),
        patch: jest.fn(),
      } as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("GET /occupations/{id}", () => {
    test("GET should respond with OK and the occupation for a valid id", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND the service that will successfully find the occupation
      const givenOccupation: IOccupation = getIOccupationMockData();
      const givenOccupationServiceMock = {
        findById: jest.fn().mockResolvedValue(givenOccupation),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN calling the handler
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect respond with OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND expect the transformation function is called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(givenOccupation, givenResourcesBaseUrl);
      // AND the handler to return the expected result
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
    });

    test("GET should respond with NOT_FOUND when occupation doesn't exist", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.GET.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND);
    });

    test("GET should respond with NOT_FOUND when model doesn't exist", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        findById: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.GET.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND);
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when failed to fetch model from DB", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        findById: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS
      );
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when service throws an error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        findById: jest.fn().mockRejectedValue(new Error("foo")),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when service throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        findById: jest.fn().mockRejectedValue("some string error"),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("GET should respond with BAD_REQUEST when id is invalid", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = "invalid-id";
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
  });
});
