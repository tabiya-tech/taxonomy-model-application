import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "../../../_shared/transform";
import { handler as occupationHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import * as authenticatorModule from "auth/authorizer";
import LanguageAPISpecs from "api-specifications/language";
import { IOccupation } from "../../../_shared/occupation.types";
import { getIOccupationMockData } from "../../../_shared/testDataHelper";
import { IOccupationService, ModelForOccupationValidationErrorCode } from "../../../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformDynamicEntitySpy = jest.spyOn(transformModule, "transformDynamicEntity");

// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation Parent GET handler", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const mockServiceRegistry = {
      occupation: {
        getParent: jest.fn().mockResolvedValue(null),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
      } as unknown as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("GET /occupations/{id}/parent", () => {
    test("GET should respond with OK and the parent occupation for a valid id", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenParent: IOccupation = getIOccupationMockData(3);
      const givenOccupationServiceMock = {
        getParent: jest.fn().mockResolvedValue(givenParent),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(transformModule.transformDynamicEntity).toHaveBeenCalledWith(givenParent, givenResourcesBaseUrl);
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformDynamicEntitySpy.mock.results[0].value);
    });

    test("GET should respond with NOT_FOUND when occupation has no parent", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getParent: jest.fn().mockResolvedValue(null),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("GET should respond with NOT_FOUND when model doesn't exist", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getParent: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue({ errorCode: ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("GET should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "GET",
        path: "/models/invalid-id/occupations/invalid-id/parent",
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
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getParent: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue({ errorCode: ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("GET should respond with INTERNAL_SERVER_ERROR when service throws", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getParent: jest.fn().mockRejectedValue(new Error("DB error")),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
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
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getParent: jest.fn().mockRejectedValue("some string error"),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("GET should respond with OK and null body if parent is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getParent: jest.fn().mockResolvedValue(null),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    describe("language negotiation", () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const FALLBACK_LANG = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE;
      const SECONDARY_LANG = LanguageAPISpecs.Constants.Languages[1]; // French
      const givenAvailableLanguages = [FALLBACK_LANG.shortCode, SECONDARY_LANG.shortCode];

      function buildEvent(headers?: Record<string, string>): APIGatewayProxyEvent {
        return {
          httpMethod: "GET",
          path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
          pathParameters: { modelId: givenModelId, id: givenOccupationId },
          headers: headers ?? {},
        } as unknown as APIGatewayProxyEvent;
      }

      function buildServiceMock(): IOccupationService {
        return {
          getParent: jest.fn().mockResolvedValue(getIOccupationMockData(3)),
          searchPaginated: jest.fn(),
          validateModelForOccupation: jest
            .fn()
            .mockResolvedValue({ errorCode: null, availableLanguages: givenAvailableLanguages }),
        } as unknown as IOccupationService;
      }

      test("GET should serve the fallback language and set headers when no Accept-Language header is present", async () => {
        // GIVEN a request without an Accept-Language header
        const givenEvent = buildEvent();
        const givenOccupationServiceMock = buildServiceMock();
        mockGetServiceRegistry().occupation = givenOccupationServiceMock;

        // WHEN calling the handler
        const actualResponse = await occupationHandler(givenEvent);

        // THEN expect OK
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        // AND the fallback language is served
        expect(actualResponse.headers?.["Content-Language"]).toEqual(FALLBACK_LANG.shortCode);
        expect(actualResponse.headers?.["Vary"]).toEqual("Accept-Language");
        // AND the service receives the fallback language
        expect(givenOccupationServiceMock.getParent).toHaveBeenCalledWith(
          givenModelId,
          givenOccupationId,
          FALLBACK_LANG.dbKeyName
        );
      });

      test.each([
        // [description, acceptLanguage header, expected Content-Language served, expected dbKeyName passed to service]
        [
          "serve the fallback language when the client explicitly requests it",
          FALLBACK_LANG.shortCode,
          FALLBACK_LANG.shortCode,
          FALLBACK_LANG.dbKeyName,
        ],
        [
          "serve a secondary language when the model has it and the client requests it",
          SECONDARY_LANG.shortCode,
          SECONDARY_LANG.shortCode,
          SECONDARY_LANG.dbKeyName,
        ],
        [
          "fall back to the fallback language when the client requests an unsupported language",
          "es",
          FALLBACK_LANG.shortCode,
          FALLBACK_LANG.dbKeyName,
        ],
        [
          "fall back to the fallback language when the Accept-Language header is malformed",
          ";;;not-a-language;;;",
          FALLBACK_LANG.shortCode,
          FALLBACK_LANG.dbKeyName,
        ],
        [
          "serve the highest-quality language from a quality-value header",
          `${FALLBACK_LANG.shortCode};q=0.5, ${SECONDARY_LANG.shortCode};q=0.9`,
          SECONDARY_LANG.shortCode,
          SECONDARY_LANG.dbKeyName,
        ],
      ])("GET should %s", async (_description, givenAcceptLanguage, expectedContentLanguage, expectedDbKeyName) => {
        // GIVEN a model with [en, fr] and the client sends Accept-Language: ${givenAcceptLanguage}
        const givenEvent = buildEvent({ "accept-language": givenAcceptLanguage });
        const givenOccupationServiceMock = buildServiceMock();
        mockGetServiceRegistry().occupation = givenOccupationServiceMock;

        // WHEN the handler is called
        const actualResponse = await occupationHandler(givenEvent);

        // THEN it responds OK and serves ${expectedContentLanguage} to both the client and repository
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers?.["Content-Language"]).toEqual(expectedContentLanguage);
        expect(givenOccupationServiceMock.getParent).toHaveBeenCalledWith(
          givenModelId,
          givenOccupationId,
          expectedDbKeyName
        );
      });
    });
  });
});
