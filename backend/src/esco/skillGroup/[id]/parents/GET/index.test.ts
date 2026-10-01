import "_test_utilities/consoleMock";
import LanguageAPISpecs from "api-specifications/language";
import {
  acceptLanguageHeaders,
  LANGUAGE_NEGOTIATION_CASES,
  MODEL_LANGUAGES,
} from "../../../_test_utilities/languageNegotiationCases";

import { APIGatewayProxyEvent } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import * as config from "server/config/config";
import { handler as SkillGroupParentsHandler } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { ISkillGroupService } from "../../../services/skillGroup.service.type";
import { ModelForSkillGroupValidationErrorCode } from "../../../_shared/skillGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as queryModule from "./query";
import * as responseModule from "./response";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { getISkillGroupMockData } from "../../../_shared/testDataHelper";
import { getMockStringId } from "_test_utilities/mockMongoId";
import * as groupQueryModule from "../../../GET/query";

jest.mock("server/serviceRegistry/serviceRegistry");
jest.mock("./query");
jest.mock("./response");
jest.mock("validator", () => ({
  ajvInstance: {
    getSchema: jest.fn(),
  },
}));

const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const mockGetSkillGroupParentsPathParameters = jest.mocked(queryModule.getSkillGroupParentsPathParameters);
const mockTransformPaginatedParents = jest.mocked(responseModule.transformPaginatedParents);

describe("SkillGroupParentsController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    getMockGetSchema().mockReset();
    const mockServiceRegistry = {
      skillGroup: {
        findById: jest.fn(),
        findParents: jest.fn(),
        findPaginated: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForSkillGroup: jest.fn(),
        findChildren: jest.fn(),
        getHistory: jest.fn(),
        setParent: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        patch: jest.fn(),
      } as ISkillGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
    getResourcesBaseUrlSpy.mockReturnValue("https://resources.example.com");
  });

  function buildEvent(path: string, queryStringParameters: Record<string, string> = {}): APIGatewayProxyEvent {
    return {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      path,
      pathParameters: {
        modelId: "model-1",
        id: "group-1",
      },
      queryStringParameters,
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
  }

  test("returns the parents skill groups when the model and skill group exist", async () => {
    const pathValidator = jest.fn().mockReturnValue(true);
    const queryValidator = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValueOnce(pathValidator).mockReturnValueOnce(queryValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);
    mockTransformPaginatedParents.mockReturnValue({ data: [], limit: null, nextCursor: null } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: null, availableLanguages: [] });
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue({
      ...getISkillGroupMockData(1, "model-1"),
      id: "group-1",
      modelId: "model-1",
    });
    mockServiceRegistry.skillGroup.findParents = jest.fn().mockResolvedValue({
      items: [
        {
          ...getISkillGroupMockData(2, "model-1"),
          id: getMockStringId(2),
        },
      ],
      nextCursor: null,
    });

    const actualResponse = await SkillGroupParentsHandler(buildEvent("/models/model-1/skillGroups/group-1/parents"));

    expect(mockGetSkillGroupParentsPathParameters).toHaveBeenCalledWith("/models/model-1/skillGroups/group-1/parents");
    expect(mockServiceRegistry.skillGroup.validateModelForSkillGroup).toHaveBeenCalledWith("model-1");
    expect(mockServiceRegistry.skillGroup.findById).toHaveBeenCalledWith("group-1");
    expect(mockServiceRegistry.skillGroup.findParents).toHaveBeenCalledWith(
      "model-1",
      "group-1",
      20,
      undefined,
      LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName
    );
    expect(mockTransformPaginatedParents).toHaveBeenCalledWith(
      expect.any(Array),
      "https://resources.example.com",
      20,
      null
    );
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("supports pagination with limit and cursor", async () => {
    const pathValidator = jest.fn().mockReturnValue(true);
    const queryValidator = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValueOnce(pathValidator).mockReturnValueOnce(queryValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const cursorItemId = getMockStringId(3);
    const cursorForSecondPage = Buffer.from(
      JSON.stringify({ id: cursorItemId, createdAt: new Date("2024-01-01").toISOString() })
    ).toString("base64");
    const encodeCursorSpy = jest.spyOn(groupQueryModule, "encodeCursor");
    const expectedNextCursor = groupQueryModule.encodeCursor(getMockStringId(99), new Date("2024-01-02"));
    mockTransformPaginatedParents.mockReturnValue({
      data: [],
      limit: 1,
      nextCursor: expectedNextCursor,
    } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: null, availableLanguages: [] });
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue({
      ...getISkillGroupMockData(1, "model-1"),
      id: "group-1",
      modelId: "model-1",
    });
    mockServiceRegistry.skillGroup.findParents = jest.fn().mockResolvedValue({
      items: [
        {
          ...getISkillGroupMockData(2, "model-1"),
          id: getMockStringId(4),
        },
      ],
      nextCursor: {
        _id: getMockStringId(99),
        createdAt: new Date("2024-01-02"),
      },
    });

    const actualResponse = await SkillGroupParentsHandler(
      buildEvent("/models/model-1/skillGroups/group-1/parents", { limit: "1", cursor: cursorForSecondPage })
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockServiceRegistry.skillGroup.findParents).toHaveBeenCalledWith(
      "model-1",
      "group-1",
      1,
      cursorItemId,
      LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName
    );
    expect(encodeCursorSpy).toHaveBeenCalledWith(getMockStringId(99), new Date("2024-01-02"));
    expect(mockTransformPaginatedParents).toHaveBeenCalledWith(
      expect.any(Array),
      "https://resources.example.com",
      1,
      expectedNextCursor
    );
  });

  test("returns NOT_FOUND when the model does not exist", async () => {
    const pathValidator = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(pathValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID });

    const actualResponse = await SkillGroupParentsHandler(buildEvent("/models/model-1/skillGroups/group-1/parents"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: SkillGroupAPISpecs.SkillGroup.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
      message: "Model not found",
      details: "No model found with id: model-1",
    });
  });

  test("returns NOT_FOUND when the skill group does not exist", async () => {
    const pathValidator = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(pathValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: null, availableLanguages: [] });
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue(null);

    const actualResponse = await SkillGroupParentsHandler(buildEvent("/models/model-1/skillGroups/group-1/parents"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: SkillGroupAPISpecs.SkillGroup.GET.Enums.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
      message: "Skill group not found",
      details: "No skill group found with id: group-1",
    });
  });

  test("returns NOT_FOUND when the skill group belongs to a different model", async () => {
    const pathValidator = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(pathValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: null, availableLanguages: [] });
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue({
      ...getISkillGroupMockData(1, "model-2"),
      id: "group-1",
      modelId: "model-2",
    });

    const actualResponse = await SkillGroupParentsHandler(buildEvent("/models/model-1/skillGroups/group-1/parents"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: SkillGroupAPISpecs.SkillGroup.GET.Enums.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
      message: "Skill group not found",
      details: "No skill group found with id: group-1",
    });
  });

  test("returns INTERNAL_SERVER_ERROR when model validation fails to fetch from the DB", async () => {
    const pathValidator = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(pathValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB });

    const actualResponse = await SkillGroupParentsHandler(buildEvent("/models/model-1/skillGroups/group-1/parents"));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
      message: "Failed to fetch the model details from the DB",
      details: "",
    });
  });

  test("returns BAD_REQUEST when the path validation fails", async () => {
    const pathValidator = Object.assign(jest.fn().mockReturnValue(false), {
      errors: [{ instancePath: "/id", message: "invalid id" }],
    });
    getMockGetSchema().mockReturnValue(pathValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const actualResponse = await SkillGroupParentsHandler(buildEvent("/models/model-1/skillGroups/group-1/parents"));

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
    });
  });

  test("returns BAD_REQUEST when the query validation fails", async () => {
    const pathValidator = jest.fn().mockReturnValue(true);
    const queryValidator = Object.assign(jest.fn().mockReturnValue(false), {
      errors: [{ instancePath: "/limit", message: "invalid limit" }],
    });
    getMockGetSchema().mockReturnValueOnce(pathValidator).mockReturnValueOnce(queryValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: null, availableLanguages: [] });
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue({
      ...getISkillGroupMockData(1, "model-1"),
      id: "group-1",
      modelId: "model-1",
    });

    const actualResponse = await SkillGroupParentsHandler(
      buildEvent("/models/model-1/skillGroups/group-1/parents", { limit: "abc" })
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
      message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
    });
  });

  test("returns BAD_REQUEST when cursor decoding fails", async () => {
    const pathValidator = jest.fn().mockReturnValue(true);
    const queryValidator = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValueOnce(pathValidator).mockReturnValueOnce(queryValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const decodeCursorSpy = jest.spyOn(groupQueryModule, "decodeCursor").mockImplementation(() => {
      throw new Error("Failed to decode cursor");
    });

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: null, availableLanguages: [] });
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue({
      ...getISkillGroupMockData(1, "model-1"),
      id: "group-1",
      modelId: "model-1",
    });

    const actualResponse = await SkillGroupParentsHandler(
      buildEvent("/models/model-1/skillGroups/group-1/parents", { cursor: "bad-cursor" })
    );

    expect(decodeCursorSpy).toHaveBeenCalledWith("bad-cursor");
    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
      message: "Invalid cursor parameter",
      details: "",
    });
  });

  test("returns INTERNAL_SERVER_ERROR when the repository throws an error", async () => {
    const pathValidator = jest.fn().mockReturnValue(true);
    const queryValidator = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValueOnce(pathValidator).mockReturnValueOnce(queryValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: null, availableLanguages: [] });
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue({
      ...getISkillGroupMockData(1, "model-1"),
      id: "group-1",
      modelId: "model-1",
    });
    mockServiceRegistry.skillGroup.findParents = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    const actualResponse = await SkillGroupParentsHandler(buildEvent("/models/model-1/skillGroups/group-1/parents"));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
      message: "Failed to retrieve the skill group parents from the DB",
      details: "",
    });
  });

  test("returns INTERNAL_SERVER_ERROR when the repository throws a non-Error value", async () => {
    const pathValidator = jest.fn().mockReturnValue(true);
    const queryValidator = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValueOnce(pathValidator).mockReturnValueOnce(queryValidator);
    mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: null, availableLanguages: [] });
    mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue({
      ...getISkillGroupMockData(1, "model-1"),
      id: "group-1",
      modelId: "model-1",
    });
    mockServiceRegistry.skillGroup.findParents = jest.fn().mockRejectedValue("repository failed");

    const actualResponse = await SkillGroupParentsHandler(buildEvent("/models/model-1/skillGroups/group-1/parents"));

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
      message: "Failed to retrieve the skill group parents from the DB",
      details: "",
    });
  });
  describe("language negotiation", () => {
    test.each(LANGUAGE_NEGOTIATION_CASES)(
      "GET should serve the skill group parents in the negotiated language when the request carries %s",
      async (_description, givenAcceptLanguage, expectedLanguage) => {
        // GIVEN a model available in the fallback and a secondary language, with a skill group in it
        getMockGetSchema().mockReturnValue(jest.fn().mockReturnValue(true) as never);
        mockGetSkillGroupParentsPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);
        mockTransformPaginatedParents.mockReturnValue({ data: [], limit: 20, nextCursor: null } as never);
        const mockServiceRegistry = mockGetServiceRegistry();
        mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
          .fn()
          .mockResolvedValue({ errorCode: null, availableLanguages: MODEL_LANGUAGES });
        mockServiceRegistry.skillGroup.findById = jest.fn().mockResolvedValue({ id: "group-1", modelId: "model-1" });
        mockServiceRegistry.skillGroup.findParents = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
        // AND a request with the given Accept-Language header
        const givenEvent = {
          ...buildEvent("/models/model-1/skillGroups/group-1/parents"),
          headers: acceptLanguageHeaders(givenAcceptLanguage),
        };

        // WHEN the handler is invoked
        const actualResponse = await SkillGroupParentsHandler(givenEvent);

        // THEN expect the response to be served in the expected language
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Language": expectedLanguage.shortCode,
          Vary: "Accept-Language",
        });
        // AND the translatable fields to be resolved to that language
        expect(mockServiceRegistry.skillGroup.findParents).toHaveBeenCalledWith(
          "model-1",
          "group-1",
          20,
          undefined,
          expectedLanguage.dbKeyName
        );
      }
    );
  });
});
