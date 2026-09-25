import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as responseModule from "./response";

import { randomUUID } from "node:crypto";
import { handler as occupationHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import * as authenticatorModule from "auth/authorizer";

import { IOccupationService, ModelForOccupationValidationErrorCode } from "../../../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { encodeCursor } from "../../../_shared/pagination/encodeCursor";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const buildSkillsResponseSpy = jest.spyOn(responseModule, "buildSkillsResponse");

// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation Skills GET handler", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const mockServiceRegistry = {
      occupation: {
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getHistory: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn(),
      } as unknown as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("GET /occupations/{id}/skills", () => {
    test("GET should respond with OK and the skills for a valid id", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenSkills = [
        {
          id: getMockStringId(3),
          UUID: randomUUID(),
          UUIDHistory: [randomUUID()],
          preferredLabel: "Skill 1",
          modelId: givenModelId,
          originUri: "uri1",
          altLabels: [],
          description: "description",
          definition: "definition",
          scopeNote: "scopeNote",
          skillType: "knowledge",
          reuseLevel: "cross-sector",
          isLocalized: false,
          parents: [],
          children: [],
          requiresSkills: [],
          requiredBySkills: [],
          requiredByOccupations: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          relationType: "essential",
          signallingValue: null,
          signallingValueLabel: "none",
        },
      ];
      const givenOccupationServiceMock = {
        getSkills: jest.fn().mockResolvedValue({ items: givenSkills, nextCursor: null }),
        getHistory: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(buildSkillsResponseSpy).toHaveBeenCalledWith(
        givenSkills,
        givenResourcesBaseUrl,
        OccupationAPISpecs.Constants.DEFAULT_LIMIT,
        null
      );
      expect(JSON.parse(actualResponse.body)).toMatchObject(buildSkillsResponseSpy.mock.results[0].value);
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
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        queryStringParameters: { limit: givenLimit.toString(), cursor: givenCursor },
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getHistory: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenOccupationServiceMock.getSkills).toHaveBeenCalledWith(
        givenModelId,
        givenOccupationId,
        givenCursorId,
        givenLimit,
        expect.any(String)
      );
    });

    test("GET should respond with NOT_FOUND when model doesn't exist", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getSkills: jest.fn(),
        getHistory: jest.fn(),
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
        path: "/models/invalid-id/occupations/invalid-id/skills",
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
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getSkills: jest.fn(),
        getHistory: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest
          .fn()
          .mockResolvedValue({ errorCode: ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB }),
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
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        queryStringParameters: { limit: "invalid" },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getSkills: jest.fn(),
        getHistory: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("GET should encode nextCursor when more skills are available", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "GET",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const nextCursorDoc = { _id: getMockStringId(3), createdAt: new Date() };
      const givenOccupationServiceMock = {
        getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: nextCursorDoc }),
        getHistory: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
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
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getSkills: jest.fn().mockRejectedValue(new Error("DB error")),
        getHistory: jest.fn(),
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
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
      } as unknown as APIGatewayProxyEvent;
      checkRole.mockResolvedValue(true);
      const givenOccupationServiceMock = {
        getSkills: jest.fn().mockRejectedValue("some string error"),
        getHistory: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupation: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages: [] }),
      } as unknown as IOccupationService;
      mockGetServiceRegistry().occupation = givenOccupationServiceMock;

      const actualResponse = await occupationHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    describe("language negotiation", () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenAvailableLanguages = ["en", "fr"];

      function buildEvent(headers?: Record<string, string>): APIGatewayProxyEvent {
        return {
          httpMethod: "GET",
          path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
          pathParameters: { modelId: givenModelId, id: givenOccupationId },
          headers: headers ?? {},
        } as unknown as APIGatewayProxyEvent;
      }

      function buildServiceMock(): IOccupationService {
        return {
          getSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          getHistory: jest.fn(),
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
        expect(actualResponse.headers?.["Content-Language"]).toEqual("en");
        expect(actualResponse.headers?.["Vary"]).toEqual("Accept-Language");
        // AND the service receives the fallback language
        expect(givenOccupationServiceMock.getSkills).toHaveBeenCalledWith(
          givenModelId,
          givenOccupationId,
          undefined,
          expect.any(Number),
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
          expect(givenOccupationServiceMock.getSkills).toHaveBeenCalledWith(
            givenModelId,
            givenOccupationId,
            undefined,
            expect.any(Number),
            expectedDbKeyName
          );
        }
      );
    });
  });
});
