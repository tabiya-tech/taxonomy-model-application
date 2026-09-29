import "_test_utilities/consoleMock";
import { handler as getHistoryHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillHistoryEntry, ISkillService, ValidateModelResult } from "esco/skill/services/skill.service.types";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import { ISkillReference } from "esco/skill/_shared/skill.types";
import { IModelInfoReference } from "modelInfo/modelInfo.types";
import { ObjectTypes } from "esco/common/objectTypes";
import SkillAPISpecs from "api-specifications/esco/skill";
import LanguageAPISpecs from "api-specifications/language";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("SkillHistoryGetController", () => {
  const givenModelId = getMockStringId(1);
  const givenSkillId = getMockStringId(2);
  const givenPath = `/models/${givenModelId}/skills/${givenSkillId}/history`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockService(overrides: Partial<ISkillService>) {
    const service = {
      validateModelForSkill: jest
        .fn()
        .mockResolvedValue({ errorCode: null, availableLanguages: [] } as ValidateModelResult),
      getHistory: jest.fn().mockResolvedValue([]),
      ...overrides,
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: service } as unknown as ServiceRegistry);
    return service;
  }

  test("should return 200 and the history for a valid skill", async () => {
    const givenEntity: ISkillReference = {
      id: getMockStringId(2),
      UUID: "d4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f70",
      preferredLabel: "Some skill",
      isLocalized: false,
      objectType: ObjectTypes.Skill,
    };
    const givenModel: IModelInfoReference = {
      id: givenModelId,
      UUID: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      name: "Some model",
      version: "1.0.0",
      localeShortCode: "en",
    };
    const givenHistory: ISkillHistoryEntry[] = [{ entity: givenEntity, model: givenModel }];
    mockService({ getHistory: jest.fn().mockResolvedValue(givenHistory) });

    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(actualBody).toHaveLength(1);
    expect(actualBody[0]).toEqual({ ...givenEntity, model: givenModel });
  });

  test("should return 200 and an empty array when the history is empty", async () => {
    mockService({ getHistory: jest.fn().mockResolvedValue([]) });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body)).toEqual([]);
  });

  test("should return 200 when the model is released (history includes released models)", async () => {
    const service = mockService({
      validateModelForSkill: jest.fn().mockResolvedValue({
        errorCode: ModelForSkillValidationErrorCode.MODEL_IS_RELEASED,
      } as ValidateModelResult),
      getHistory: jest.fn().mockResolvedValue([]),
    });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(service.getHistory).toHaveBeenCalledWith(givenSkillId, expect.any(String));
  });

  test("should return 400 if route does not match", async () => {
    mockService({});
    const actualResponse = await getHistoryHandler({ path: "/invalid/path" } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 404 if model not found", async () => {
    mockService({
      validateModelForSkill: jest.fn().mockResolvedValue({
        errorCode: ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID,
      } as ValidateModelResult),
    });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status404.History.ErrorCodes.MODEL_NOT_FOUND
    );
  });

  test("should return 404 if the skill does not exist", async () => {
    mockService({ getHistory: jest.fn().mockResolvedValue(null) });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status404.History.ErrorCodes.SKILL_NOT_FOUND
    );
  });

  test("should return 500 with DB_FAILED_TO_RETRIEVE_SKILL_HISTORY when model validation fails to fetch from the DB", async () => {
    mockService({
      validateModelForSkill: jest.fn().mockResolvedValue({
        errorCode: ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB,
      } as ValidateModelResult),
    });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status500.History.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_HISTORY
    );
  });

  test("should return 500 when the service throws", async () => {
    mockService({ getHistory: jest.fn().mockRejectedValue(new Error("DB error")) });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status500.History.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_HISTORY
    );
  });

  describe("language negotiation", () => {
    const FALLBACK_LANG = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE;
    const SECONDARY_LANG = LanguageAPISpecs.Constants.Languages[1];
    const givenAvailableLanguages = [FALLBACK_LANG.shortCode, SECONDARY_LANG.shortCode];

    function buildEvent(headers?: Record<string, string>): APIGatewayProxyEvent {
      return {
        path: givenPath,
        headers: headers ?? {},
      } as unknown as APIGatewayProxyEvent;
    }

    function buildServiceMock(): ISkillService {
      const service = {
        validateModelForSkill: jest
          .fn()
          .mockResolvedValue({ errorCode: null, availableLanguages: givenAvailableLanguages } as ValidateModelResult),
        getHistory: jest.fn().mockResolvedValue([]),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: service } as unknown as ServiceRegistry);
      return service;
    }

    test("GET should serve the fallback language and set headers when no Accept-Language header is present", async () => {
      const givenSkillServiceMock = buildServiceMock();

      const actualResponse = await getHistoryHandler(buildEvent());

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(FALLBACK_LANG.shortCode);
      expect(actualResponse.headers?.["Vary"]).toEqual("Accept-Language");
      expect(givenSkillServiceMock.getHistory).toHaveBeenCalledWith(givenSkillId, FALLBACK_LANG.dbKeyName);
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
      const givenSkillServiceMock = buildServiceMock();

      const actualResponse = await getHistoryHandler(buildEvent({ "accept-language": givenAcceptLanguage }));

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(expectedContentLanguage);
      expect(givenSkillServiceMock.getHistory).toHaveBeenCalledWith(givenSkillId, expectedDbKeyName);
    });

    test("GET should serve the fallback language when availableLanguages is empty (MODEL_IS_RELEASED)", async () => {
      // GIVEN the model returns availableLanguages: [] (as MODEL_IS_RELEASED does — it falls through to language
      // resolution with an empty list, which resolveLanguageConfig maps to the fallback language)
      const givenSkillServiceMock = buildServiceMock();
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue({
        errorCode: null,
        availableLanguages: [],
      } as ValidateModelResult);

      const actualResponse = await getHistoryHandler(buildEvent({ "accept-language": SECONDARY_LANG.shortCode }));

      // THEN the fallback language is served regardless of the Accept-Language header
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(FALLBACK_LANG.shortCode);
      // AND the service receives the fallback language
      expect(givenSkillServiceMock.getHistory).toHaveBeenCalledWith(givenSkillId, FALLBACK_LANG.dbKeyName);
    });
  });
});
