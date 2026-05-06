import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as responseModule from "./response";

import { handler as occupationHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import * as authenticatorModule from "auth/authorizer";
import { IOccupation } from "../_shared/occupation.types";
import { getIOccupationMockData } from "../_shared/testDataHelper";
import { IOccupationService, ModelForOccupationValidationErrorCode } from "../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { encodeCursor } from "../_shared/pagination/encodeCursor";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const buildGETResponseSpy = jest.spyOn(responseModule, "buildGETResponse");

// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation List GET handler", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Initialize the service registry mock
    const mockServiceRegistry = {
      occupation: {
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupation: jest.fn(),
      } as unknown as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("GET /occupations (paginated)", () => {
    test("GET should respond with OK and the paginated occupations for a valid modelId", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as unknown as APIGatewayProxyEvent;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND the service that will successfully find the occupations
      const givenOccupations: IOccupation[] = [getIOccupationMockData(1), getIOccupationMockData(2)];
      const givenOccupationServiceMock = {
        findPaginated: jest.fn().mockResolvedValue({ items: givenOccupations, nextCursor: null }),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN calling the handler
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect respond with OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND expect the transformation function is called correctly
      expect(buildGETResponseSpy).toHaveBeenCalledWith(
        givenOccupations,
        givenResourcesBaseUrl,
        OccupationAPISpecs.Constants.DEFAULT_LIMIT,
        null
      );
      // AND the handler to return the expected result
      expect(JSON.parse(actualResponse.body)).toMatchObject(buildGETResponseSpy.mock.results[0].value);
    });

    test("GET should respect limit and cursor parameters", async () => {
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenCursorId = getMockStringId(2);
      const givenCreatedAt = new Date();
      const givenCursor = encodeCursor(givenCursorId, givenCreatedAt);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations`,
        queryStringParameters: { limit: givenLimit.toString(), cursor: givenCursor },
        pathParameters: { modelId: givenModelId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const givenOccupations = [getIOccupationMockData(1)];
      const nextCursorDoc = { _id: getMockStringId(3), createdAt: new Date() };
      const givenOccupationServiceMock = {
        findPaginated: jest.fn().mockResolvedValue({ items: givenOccupations, nextCursor: nextCursorDoc }),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenOccupationServiceMock.findPaginated).toHaveBeenCalledWith(
        givenModelId,
        { id: givenCursorId, createdAt: givenCreatedAt },
        givenLimit
      );
    });

    test("GET should respond with BAD_REQUEST for invalid query parameters", async () => {
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations`,
        queryStringParameters: { limit: "invalid" },
        pathParameters: { modelId: givenModelId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("GET should respond with NOT_FOUND when model doesn't exist", async () => {
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        findPaginated: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("GET should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "GET",
        path: "/models/invalid-id/occupations",
        pathParameters: { modelId: "invalid-id" },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        findPaginated: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when service throws", async () => {
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations`,
        pathParameters: { modelId: givenModelId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        findPaginated: jest.fn().mockRejectedValue(new Error("DB error")),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});
