import "_test_utilities/consoleMock";
import { handler as getOccupationsHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillService, ValidateModelResult } from "../../../services/skill.service.types";
import { ModelForSkillValidationErrorCode } from "../../../_shared/skill.types";
import LanguageAPISpecs from "api-specifications/language";
import SkillAPISpecs from "api-specifications/esco/skill";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("SkillOccupationsGetController", () => {
  const givenModelId = getMockStringId(1);
  const givenSkillId = getMockStringId(2);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 200 and occupations", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
      findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
      getOccupations: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
  });

  test("should return 400 if route does not match", async () => {
    const event = { path: "/invalid/path" };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 404 if model not found", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest.fn().mockResolvedValue({
        errorCode: ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID,
      } as ValidateModelResult),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status404.Occupations.ErrorCodes.MODEL_NOT_FOUND
    );
  });

  test("should return 404 if skill not found", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status404.Occupations.ErrorCodes.SKILL_NOT_FOUND
    );
  });

  test("should return 500 if service fails", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
      findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
      getOccupations: jest.fn().mockRejectedValue(new Error("DB error")),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should return 400 if query params are invalid", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
      findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = {
      path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
      queryStringParameters: { limit: "invalid" },
    };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 500 with DB_FAILED_TO_RETRIEVE_SKILL_OCCUPATIONS if model validation fails with DB error", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest.fn().mockResolvedValue({
        errorCode: ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB,
      } as ValidateModelResult),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status500.Occupations.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_OCCUPATIONS
    );
  });

  test("should return 200 with nextCursor when cursor is present", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
      findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
      getOccupations: jest.fn().mockResolvedValue({
        items: [],
        nextCursor: { _id: "cursorId", createdAt: new Date() },
      }),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
  });

  describe("language negotiation", () => {
    const FALLBACK_LANG = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE;
    const SECONDARY_LANG = LanguageAPISpecs.Constants.Languages[1];
    const givenAvailableLanguages = [FALLBACK_LANG.shortCode, SECONDARY_LANG.shortCode];

    function buildEvent(headers?: Record<string, string>): APIGatewayProxyEvent {
      return {
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        headers: headers ?? {},
      } as unknown as APIGatewayProxyEvent;
    }

    function buildServiceMock(): ISkillService {
      return {
        validateModelForSkill: jest
          .fn()
          .mockResolvedValue({ errorCode: null, availableLanguages: givenAvailableLanguages } as ValidateModelResult),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getOccupations: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      } as unknown as ISkillService;
    }

    test("GET should serve the fallback language and set headers when no Accept-Language header is present", async () => {
      const givenEvent = buildEvent();
      const givenSkillServiceMock = buildServiceMock();
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const actualResponse = await getOccupationsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(FALLBACK_LANG.shortCode);
      expect(actualResponse.headers?.["Vary"]).toEqual("Accept-Language");
      expect(givenSkillServiceMock.findById).toHaveBeenCalledWith(givenSkillId, FALLBACK_LANG.dbKeyName);
      expect(givenSkillServiceMock.getOccupations).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        expect.any(Number),
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

      const actualResponse = await getOccupationsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(expectedContentLanguage);
      expect(givenSkillServiceMock.findById).toHaveBeenCalledWith(givenSkillId, expectedDbKeyName);
      expect(givenSkillServiceMock.getOccupations).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        expect.any(Number),
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

      const actualResponse = await getOccupationsHandler(givenEvent);

      // THEN the fallback language is served regardless of the Accept-Language header
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(FALLBACK_LANG.shortCode);
      // AND both service calls receive the fallback language
      expect(givenSkillServiceMock.findById).toHaveBeenCalledWith(givenSkillId, FALLBACK_LANG.dbKeyName);
      expect(givenSkillServiceMock.getOccupations).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        expect.any(Number),
        undefined,
        FALLBACK_LANG.dbKeyName
      );
    });
  });
});
