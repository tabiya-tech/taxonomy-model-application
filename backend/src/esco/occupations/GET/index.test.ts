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
import { EmbeddableField } from "embeddings/service/types";
import { getIOccupationMockData } from "../_shared/testDataHelper";
import { IOccupationService, ModelForOccupationValidationErrorCode } from "../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { encodeCursor } from "../_shared/pagination/encodeCursor";
import { encodeSearchCursor } from "esco/common/searchCursor";

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
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
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
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenOccupationServiceMock.findPaginated).toHaveBeenCalledWith(
        givenModelId,
        { id: givenCursorId, createdAt: givenCreatedAt },
        givenLimit,
        true,
        expect.any(String)
      );
    });

    test("GET should delegate to searchPaginated when a query is provided and pass through its encoded cursor", async () => {
      // GIVEN a request with a search query and explicit searchFields
      const givenModelId = getMockStringId(1);
      const givenSearchValue = "software";
      const givenCursor = encodeSearchCursor(5);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations`,
        queryStringParameters: {
          query: givenSearchValue,
          searchFields: "preferredLabel,description",
          cursor: givenCursor,
        },
        pathParameters: { modelId: givenModelId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);

      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND the service returns a page with an already-encoded nextCursor
      const givenOccupations = [getIOccupationMockData(1)];
      const givenNextCursor = "nextOpaqueCursor";
      const givenOccupationServiceMock = {
        findPaginated: jest.fn(),
        searchPaginated: jest.fn().mockResolvedValue({ items: givenOccupations, nextCursor: givenNextCursor }),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      // WHEN calling the handler
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect OK and the search path to have been used (not the plain list path)
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenOccupationServiceMock.searchPaginated).toHaveBeenCalledWith(
        givenModelId,
        givenSearchValue,
        [EmbeddableField.preferredLabel, EmbeddableField.description],
        givenCursor,
        OccupationAPISpecs.Constants.DEFAULT_LIMIT,
        expect.any(String)
      );
      expect(givenOccupationServiceMock.findPaginated).not.toHaveBeenCalled();
      // AND the response to be built with the service's already-encoded nextCursor
      expect(buildGETResponseSpy).toHaveBeenCalledWith(
        givenOccupations,
        givenResourcesBaseUrl,
        OccupationAPISpecs.Constants.DEFAULT_LIMIT,
        givenNextCursor
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
      const givenOccupationServiceMock = {
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

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
          .mockResolvedValue({ errorCode: ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID }),
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
          .mockResolvedValue({ errorCode: ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB }),
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
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    describe("language negotiation", () => {
      const givenModelId = getMockStringId(1);
      const givenAvailableLanguages = ["en", "fr"];

      function buildEvent(headers?: Record<string, string>): APIGatewayProxyEvent {
        return {
          httpMethod: "GET",
          path: `/models/${givenModelId}/occupations`,
          pathParameters: { modelId: givenModelId },
          headers: headers ?? {},
        } as unknown as APIGatewayProxyEvent;
      }

      function buildServiceMock(): IOccupationService {
        return {
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
        expect(actualResponse.headers?.["Content-Language"]).toEqual("en");
        expect(actualResponse.headers?.["Vary"]).toEqual("Accept-Language");
        // AND the service receives the fallback language
        expect(givenOccupationServiceMock.findPaginated).toHaveBeenCalledWith(
          givenModelId,
          undefined,
          expect.any(Number),
          true,
          "en"
        );
      });

      test.each([
        // [description, acceptLanguage header, expected Content-Language served, expected dbKeyName passed to service]
        ["serve the fallback language when the client explicitly requests it", "en", "en", "en"],
        ["serve a secondary language when the model has it and the client requests it", "fr", "fr", "fr"],
        ["fall back to the fallback language when the client requests an unsupported language", "es", "en", "en"],
        ["fall back to the fallback language when the Accept-Language header is malformed", ";;;not-a-language;;;", "en", "en"],
        ["serve the highest-quality language from a quality-value header", "en;q=0.5, fr;q=0.9", "fr", "fr"],
      ])(
        "GET should %s",
        async (_description, givenAcceptLanguage, expectedContentLanguage, expectedDbKeyName) => {
          // GIVEN a model with [en, fr] and the client sends Accept-Language: ${givenAcceptLanguage}
          const givenEvent = buildEvent({ "accept-language": givenAcceptLanguage });
          const givenOccupationServiceMock = buildServiceMock();
          mockGetServiceRegistry().occupation = givenOccupationServiceMock;

          // WHEN the handler is called
          const actualResponse = await occupationHandler(givenEvent);

          // THEN it responds OK and serves ${expectedContentLanguage} to both the client and repository
          expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
          expect(actualResponse.headers?.["Content-Language"]).toEqual(expectedContentLanguage);
          expect(givenOccupationServiceMock.findPaginated).toHaveBeenCalledWith(
            givenModelId,
            undefined,
            expect.any(Number),
            true,
            expectedDbKeyName
          );
        }
      );

      test("GET should serve the fallback language when availableLanguages is empty (MODEL_IS_RELEASED)", async () => {
        // GIVEN the model returns availableLanguages: [] (as MODEL_IS_RELEASED does)
        const givenEvent = buildEvent({ "accept-language": "fr" });
        const givenOccupationServiceMock = {
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
        } as unknown as IOccupationService;
        mockGetServiceRegistry().occupation = givenOccupationServiceMock;

        // WHEN calling the handler
        const actualResponse = await occupationHandler(givenEvent);

        // THEN the fallback language is served regardless of the Accept-Language header
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers?.["Content-Language"]).toEqual("en");
        // AND the service receives the fallback language
        expect(givenOccupationServiceMock.findPaginated).toHaveBeenCalledWith(
          givenModelId,
          undefined,
          expect.any(Number),
          true,
          "en"
        );
      });
    });
  });
});
