import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as responseModule from "./response";

import { handler as occupationHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import * as authenticatorModule from "auth/authorizer";
import { IOccupation } from "../../../_shared/occupation.types";
import { getIOccupationMockData } from "../../../_shared/testDataHelper";
import { IOccupationService, ModelForOccupationValidationErrorCode } from "../../../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { encodeCursor } from "../../../_shared/pagination/encodeCursor";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const buildChildrenResponseSpy = jest.spyOn(responseModule, "buildChildrenResponse");

// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation Children GET handler", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const mockServiceRegistry = {
      occupation: {
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
      } as unknown as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("GET /occupations/{id}/children", () => {
    test("GET should respond with OK and the children for a valid id", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/children`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenChildren: IOccupation[] = [getIOccupationMockData(3)];
      const givenOccupationServiceMock = {
        getChildren: jest.fn().mockResolvedValue({ items: givenChildren, nextCursor: null }),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(buildChildrenResponseSpy).toHaveBeenCalledWith(
        givenChildren,
        givenResourcesBaseUrl,
        OccupationAPISpecs.Constants.DEFAULT_LIMIT,
        null
      );
      expect(JSON.parse(actualResponse.body)).toMatchObject(buildChildrenResponseSpy.mock.results[0].value);
    });

    test("GET should respect limit and cursor parameters", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenLimit = 10;
      const givenCursorId = getMockStringId(3);
      const givenCreatedAt = new Date();
      const givenCursor = encodeCursor(givenCursorId, givenCreatedAt);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/children`,
        queryStringParameters: { limit: givenLimit.toString(), cursor: givenCursor },
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenOccupationServiceMock.getChildren).toHaveBeenCalledWith(
        givenModelId,
        givenOccupationId,
        givenCursorId,
        givenLimit
      );
    });

    test("GET should respond with NOT_FOUND when model doesn't exist", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/children`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getChildren: jest.fn(),
        searchPaginated: jest.fn(),
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
        path: "/models/invalid-id/occupations/invalid-id/children",
        pathParameters: { modelId: "invalid-id", id: "invalid-id" },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/children`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getChildren: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("GET should respond with BAD_REQUEST when query params are invalid", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/children`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        queryStringParameters: { limit: "invalid" },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getChildren: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("GET should encode nextCursor when more children are available", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/children`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const nextCursorDoc = { _id: getMockStringId(3), createdAt: new Date() };
      const givenOccupationServiceMock = {
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: nextCursorDoc }),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      const body = JSON.parse(actualResponse.body);
      expect(body.nextCursor).toBeTruthy();
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when service throws", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/children`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getChildren: jest.fn().mockRejectedValue(new Error("DB error")),
        searchPaginated: jest.fn(),
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
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/children`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getChildren: jest.fn().mockRejectedValue("some string error"),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});
