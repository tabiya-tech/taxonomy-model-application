import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import { handler as occupationHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import * as authenticatorModule from "auth/authorizer";
import {
  IOccupationService,
  ModelForOccupationValidationErrorCode,
  OccupationHasChildrenError,
  OccupationModelValidationError,
  OccupationServiceError,
  OccupationServiceErrorCode,
} from "../../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation Detail DELETE handler", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const mockServiceRegistry = {
      occupation: {
        create: jest.fn(),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
        getParent: jest.fn(),
        getChildren: jest.fn(),
        getSkills: jest.fn(),
        update: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        getHistory: jest.fn(),
      } as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("DELETE /models/{modelId}/occupations/{id}", () => {
    test("should respond with NO_CONTENT on successful deletion", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.DELETE,
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = {
        delete: jest.fn().mockResolvedValue(undefined),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN calling the handler
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect respond with NO_CONTENT
      expect(actualResponse.statusCode).toEqual(StatusCodes.NO_CONTENT);
      expect(givenOccupationServiceMock.delete).toHaveBeenCalledWith(givenOccupationId, givenModelId);
    });

    test("should respond with BAD_REQUEST when path parameters are invalid", async () => {
      // GIVEN an event with invalid mongo id for modelId
      const givenEvent = {
        httpMethod: HTTP_VERBS.DELETE,
        path: `/models/invalid-id/occupations/${getMockStringId(1)}`,
        pathParameters: { modelId: "invalid-id", id: getMockStringId(1) },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      // WHEN calling the handler
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect respond with BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with CONFLICT when OccupationHasChildrenError is thrown", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.DELETE,
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = {
        delete: jest.fn().mockRejectedValue(new OccupationHasChildrenError()),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.DELETE.Errors.Status409.ErrorCodes.CANNOT_DELETE_ENTITY_WITH_CHILDREN
      );
    });

    test("should respond with NOT_FOUND when OccupationModelValidationError MODEL_NOT_FOUND_BY_ID is thrown", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.DELETE,
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = {
        delete: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
          ),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.Occupation.DELETE.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND);
    });

    test("should respond with BAD_REQUEST when OccupationModelValidationError MODEL_IS_RELEASED is thrown", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.DELETE,
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = {
        delete: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED)
          ),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.DELETE.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL
      );
    });

    test("should respond with INTERNAL_SERVER_ERROR when default OccupationModelValidationError is thrown", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.DELETE,
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = {
        delete: jest
          .fn()
          .mockRejectedValue(
            new OccupationModelValidationError(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB)
          ),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with NOT_FOUND when OccupationServiceError OCCUPATION_NOT_FOUND is thrown", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.DELETE,
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = {
        delete: jest
          .fn()
          .mockRejectedValue(new OccupationServiceError(OccupationServiceErrorCode.OCCUPATION_NOT_FOUND)),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.DELETE.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND
      );
    });

    test("should respond with INTERNAL_SERVER_ERROR when generic unknown error is thrown", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.DELETE,
        path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = {
        delete: jest.fn().mockRejectedValue(new Error("Unexpected error")),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.Occupation.DELETE.Errors.Status500.ErrorCodes.DB_FAILED_TO_DELETE_OCCUPATION
      );
    });
  });
});
