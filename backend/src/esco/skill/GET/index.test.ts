import "_test_utilities/consoleMock";
import { handler as getHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillService, ValidateModelResult } from "../services/skill.service.types";
import { ISkill, ModelForSkillValidationErrorCode } from "../_shared/skill.types";
import { getISkillMockData } from "../_shared/testDataHelper";
import * as config from "server/config/config";
import LanguageAPISpecs from "api-specifications/language";
import SkillAPISpecs from "api-specifications/esco/skill";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("SkillGetController", () => {
  const givenModelId = getMockStringId(1);
  const givenResourcesBaseUrl = "https://some/path/to/api/resources";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);
  });

  test("should return 200 and paginated skills", async () => {
    const givenSkills: ISkill[] = [getISkillMockData(1, givenModelId)];
    const givenSkillServiceMock = {
      findPaginated: jest.fn().mockResolvedValue({ items: givenSkills, nextCursor: null }),
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
  });

  test("should return 400 if modelId is invalid", async () => {
    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: "/models/invalid-uuid/skills",
      pathParameters: { modelId: "invalid-uuid" },
    };
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 404 if model not found", async () => {
    const givenSkillServiceMock = {
      findPaginated: jest.fn(),
      validateModelForSkill: jest.fn().mockResolvedValue({
        errorCode: ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID,
      } as ValidateModelResult),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND
    );
  });

  test("should return 500 if model validation fails", async () => {
    const givenSkillServiceMock = {
      findPaginated: jest.fn(),
      validateModelForSkill: jest.fn().mockResolvedValue({
        errorCode: ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB,
      } as ValidateModelResult),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should return 400 if query params are invalid", async () => {
    const givenSkillServiceMock = {
      findPaginated: jest.fn(),
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
      queryStringParameters: { limit: "invalid" },
    };
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 500 if service throws", async () => {
    const givenSkillServiceMock = {
      findPaginated: jest.fn().mockRejectedValue(new Error("DB error")),
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should pass the search value and fields to findPaginated and return 200 when a query is provided", async () => {
    const givenSkills: ISkill[] = [getISkillMockData(1, givenModelId)];
    const givenNextCursor = "encoded-cursor";
    const givenFindPaginated = jest.fn().mockResolvedValue({ items: givenSkills, nextCursor: givenNextCursor });
    const givenSkillServiceMock = {
      findPaginated: givenFindPaginated,
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const givenCursor = Buffer.from(JSON.stringify({ offset: 0 })).toString("base64");
    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
      queryStringParameters: { query: "python", searchFields: "preferredLabel,description", cursor: givenCursor },
    };

    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(givenFindPaginated).toHaveBeenCalledWith(
      givenModelId,
      givenCursor,
      expect.any(Number),
      "python",
      ["preferredLabel", "description"],
      undefined,
      expect.any(String)
    );
    expect(JSON.parse(actualResponse.body).nextCursor).toBe(givenNextCursor);
  });

  test("should return 500 if findPaginated throws while searching", async () => {
    const givenSkillServiceMock = {
      findPaginated: jest.fn().mockRejectedValue(new Error("search error")),
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
      queryStringParameters: { query: "python" },
    };

    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  describe("language negotiation", () => {
    const FALLBACK_LANG = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE;
    const SECONDARY_LANG = LanguageAPISpecs.Constants.Languages[1];
    const givenAvailableLanguages = [FALLBACK_LANG.shortCode, SECONDARY_LANG.shortCode];

    function buildEvent(headers?: Record<string, string>): APIGatewayProxyEvent {
      return {
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${givenModelId}/skills`,
        pathParameters: { modelId: givenModelId },
        headers: headers ?? {},
      } as unknown as APIGatewayProxyEvent;
    }

    function buildServiceMock(): ISkillService {
      return {
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkill: jest
          .fn()
          .mockResolvedValue({ errorCode: null, availableLanguages: givenAvailableLanguages } as ValidateModelResult),
      } as unknown as ISkillService;
    }

    test("GET should serve the fallback language and set headers when no Accept-Language header is present", async () => {
      const givenEvent = buildEvent();
      const givenSkillServiceMock = buildServiceMock();
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const actualResponse = await getHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(FALLBACK_LANG.shortCode);
      expect(actualResponse.headers?.["Vary"]).toEqual("Accept-Language");
      expect(givenSkillServiceMock.findPaginated).toHaveBeenCalledWith(
        givenModelId,
        undefined,
        expect.any(Number),
        undefined,
        expect.anything(),
        undefined,
        FALLBACK_LANG.dbKeyName
      );
    });

    test.each([
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
      const givenEvent = buildEvent({ "accept-language": givenAcceptLanguage });
      const givenSkillServiceMock = buildServiceMock();
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const actualResponse = await getHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(expectedContentLanguage);
      expect(givenSkillServiceMock.findPaginated).toHaveBeenCalledWith(
        givenModelId,
        undefined,
        expect.any(Number),
        undefined,
        expect.anything(),
        undefined,
        expectedDbKeyName
      );
    });

    test("GET should serve the fallback language when availableLanguages is empty (MODEL_IS_RELEASED)", async () => {
      // GIVEN the model returns availableLanguages: [] (as MODEL_IS_RELEASED does — it falls through to language
      // resolution with an empty list, which resolveLanguageConfig maps to the fallback language)
      const givenEvent = buildEvent({ "accept-language": SECONDARY_LANG.shortCode });
      const givenSkillServiceMock = buildServiceMock();
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue({
        errorCode: null,
        availableLanguages: [],
      } as ValidateModelResult);
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const actualResponse = await getHandler(givenEvent);

      // THEN the fallback language is served regardless of the Accept-Language header
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(FALLBACK_LANG.shortCode);
      // AND the service receives the fallback language
      expect(givenSkillServiceMock.findPaginated).toHaveBeenCalledWith(
        givenModelId,
        undefined,
        expect.any(Number),
        undefined,
        expect.anything(),
        undefined,
        FALLBACK_LANG.dbKeyName
      );
    });
  });
});
