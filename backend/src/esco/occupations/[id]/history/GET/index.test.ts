import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import { handler as occupationHistoryHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import * as authenticatorModule from "auth/authorizer";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import { IModelInfoReference } from "modelInfo/modelInfo.types";
import {
  IOccupationHistoryEntry,
  IOccupationService,
  ModelForOccupationValidationErrorCode,
} from "esco/occupations/services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

function givenValidEvent(modelId: string, occupationId: string): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: `/models/${modelId}/occupations/${occupationId}/history`,
    pathParameters: { modelId, id: occupationId },
  } as unknown as APIGatewayProxyEvent;
}

describe("Test for occupation History GET handler", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const mockServiceRegistry = {
      occupation: {
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue([]),
      } as unknown as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("GET /occupations/{id}/history", () => {
    test("GET should respond with OK and the history for a valid id", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = givenValidEvent(givenModelId, givenOccupationId);
      checkRole.mockResolvedValue(true);

      // AND the service resolves a history with one entry: the occupation reference + a stripped model reference
      const givenEntity: IOccupationReference = {
        id: getMockStringId(2),
        UUID: "d4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f70",
        preferredLabel: "Software developer",
        occupationGroupCode: "2512",
        code: "2512.1",
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: false,
      };
      const givenModel: IModelInfoReference = {
        id: givenModelId,
        UUID: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        name: "Some model",
        version: "1.0.0",
        localeShortCode: "en",
      };
      const givenHistory: IOccupationHistoryEntry[] = [{ entity: givenEntity, model: givenModel }];
      const givenOccupationServiceMock = {
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue(givenHistory),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN calling the handler
      const actualResponse = await occupationHistoryHandler(givenEvent);

      // THEN expect respond with OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND the handler returns an array of items with the occupation reference fields flat and a nested model
      const actualBody = JSON.parse(actualResponse.body);
      expect(actualBody).toHaveLength(1);
      expect(actualBody[0]).toEqual({ ...givenEntity, model: givenModel });
    });

    test("GET should respond with OK and an empty array when the history is empty", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = givenValidEvent(givenModelId, givenOccupationId);
      const givenOccupationServiceMock = {
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue([]),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHistoryHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(JSON.parse(actualResponse.body)).toEqual([]);
    });

    test("GET should respond with OK when the model is released (history includes released models)", async () => {
      // GIVEN the model validation reports the model is released
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = givenValidEvent(givenModelId, givenOccupationId);
      const givenOccupationServiceMock = {
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue(ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED),
        getHistory: jest.fn().mockResolvedValue([]),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN calling the handler
      const actualResponse = await occupationHistoryHandler(givenEvent);

      // THEN expect OK (not an error) and the history to still be fetched
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenOccupationServiceMock.getHistory).toHaveBeenCalledWith(givenOccupationId);
    });

    test("GET should respond with NOT_FOUND when the occupation doesn't exist", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = givenValidEvent(givenModelId, givenOccupationId);
      const givenOccupationServiceMock = {
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue(null),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHistoryHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.GET.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND);
    });

    test("GET should respond with NOT_FOUND when the model doesn't exist", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = givenValidEvent(givenModelId, givenOccupationId);
      const givenOccupationServiceMock = {
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
        getHistory: jest.fn(),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHistoryHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(OccupationAPISpecs.GET.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND);
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when failed to fetch the model from the DB", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = givenValidEvent(givenModelId, givenOccupationId);
      const givenOccupationServiceMock = {
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
        getHistory: jest.fn(),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHistoryHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        OccupationAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS
      );
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when the service throws an error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = givenValidEvent(givenModelId, givenOccupationId);
      const givenOccupationServiceMock = {
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockRejectedValue(new Error("foo")),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHistoryHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when the service throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = givenValidEvent(givenModelId, givenOccupationId);
      const givenOccupationServiceMock = {
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockRejectedValue("some string error"),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHistoryHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("GET should respond with BAD_REQUEST when the id is invalid", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = "invalid-id";
      const givenEvent = givenValidEvent(givenModelId, givenOccupationId);

      const actualResponse = await occupationHistoryHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
  });
});
