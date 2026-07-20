import "_test_utilities/consoleMock";
import { handler as getHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillService } from "../services/skill.service.types";
import { ISkill, ModelForSkillValidationErrorCode } from "../_shared/skill.types";
import { getISkillMockData } from "../_shared/testDataHelper";
import * as config from "server/config/config";

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
      validateModelForSkill: jest.fn().mockResolvedValue(null),
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
      validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
    };
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
  });

  test("should return 500 if model validation fails", async () => {
    const givenSkillServiceMock = {
      findPaginated: jest.fn(),
      validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
    };
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should return 400 if query params are invalid", async () => {
    const givenSkillServiceMock = {
      findPaginated: jest.fn(),
      validateModelForSkill: jest.fn().mockResolvedValue(null),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
      queryStringParameters: { limit: "invalid" },
    };
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 500 if service throws", async () => {
    const givenSkillServiceMock = {
      findPaginated: jest.fn().mockRejectedValue(new Error("DB error")),
      validateModelForSkill: jest.fn().mockResolvedValue(null),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
    };
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should pass the search value and fields to findPaginated and return 200 when a query is provided", async () => {
    // GIVEN a service whose findPaginated returns a page of skills and a next cursor
    const givenSkills: ISkill[] = [getISkillMockData(1, givenModelId)];
    const givenNextCursor = "encoded-cursor";
    const givenFindPaginated = jest.fn().mockResolvedValue({ items: givenSkills, nextCursor: givenNextCursor });
    const givenSkillServiceMock = {
      findPaginated: givenFindPaginated,
      validateModelForSkill: jest.fn().mockResolvedValue(null),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    // AND an event with a search query and searchFields
    const givenCursor = Buffer.from(JSON.stringify({ offset: 0 })).toString("base64");
    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
      queryStringParameters: { query: "python", searchFields: "preferredLabel,description", cursor: givenCursor },
    };

    // WHEN the handler is invoked
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);

    // THEN expect findPaginated to have been called with the cursor, search value and fields, and a 200 returned
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(givenFindPaginated).toHaveBeenCalledWith(givenModelId, givenCursor, expect.any(Number), "python", [
      "preferredLabel",
      "description",
    ]);
    expect(JSON.parse(actualResponse.body).nextCursor).toBe(givenNextCursor);
  });

  test("should return 500 if findPaginated throws while searching", async () => {
    // GIVEN a service whose findPaginated rejects
    const givenSkillServiceMock = {
      findPaginated: jest.fn().mockRejectedValue(new Error("search error")),
      validateModelForSkill: jest.fn().mockResolvedValue(null),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    // AND an event with a search query
    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
      queryStringParameters: { query: "python" },
    };

    // WHEN the handler is invoked
    const actualResponse = await getHandler(event as unknown as APIGatewayProxyEvent);

    // THEN expect a 500 response
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
