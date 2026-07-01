import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "modelInfo/transform";
import { handler as occupationHistoryHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import * as authenticatorModule from "auth/authorizer";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import {
  IOccupationHistoryEntry,
  IOccupationService,
  ModelForOccupationValidationErrorCode,
} from "../../../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformSpy = jest.spyOn(transformModule, "transform");

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

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND the service resolves a history with one entry
      const givenModel = getIModelInfoMockData(1);
      const givenHistory: IOccupationHistoryEntry[] = [
        {
          model: givenModel,
          modelHistoryDetails: [
            {
              id: givenModel.id,
              UUID: givenModel.UUID,
              name: givenModel.name,
              version: givenModel.version,
              localeShortCode: givenModel.locale.shortCode,
            },
          ],
        },
      ];
      const givenOccupationServiceMock = {
        validateModelForOccupation: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue(givenHistory),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN calling the handler
      const actualResponse = await occupationHistoryHandler(givenEvent);

      // THEN expect respond with OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND the transform function is called for the resolved model
      expect(transformModule.transform).toHaveBeenCalledWith(
        givenModel,
        givenResourcesBaseUrl,
        givenHistory[0].modelHistoryDetails
      );
      // AND the handler returns the transformed array
      const actualBody = JSON.parse(actualResponse.body);
      expect(actualBody).toHaveLength(1);
      expect(actualBody[0]).toMatchObject(transformSpy.mock.results[0].value);
    });

    test("GET should respond with OK and an empty array when the history is empty", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = givenValidEvent(givenModelId, givenOccupationId);
      const givenOccupationServiceMock = {
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
