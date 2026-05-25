import "_test_utilities/consoleMock";
import { handler as postHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillService } from "../services/skill.service.types";
import { ISkill } from "../_shared/skill.types";
import { getISkillMockData } from "../_shared/testDataHelper";
import * as config from "server/config/config";
import SkillAPISpecs from "api-specifications/esco/skill";
import { SkillModelValidationError } from "../services/skill.service.types";
import { ModelForSkillValidationErrorCode } from "../_shared/skill.types";
import * as authenticatorModule from "auth/authorizer";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

describe("SkillPostController", () => {
  const givenModelId = getMockStringId(1);
  const givenResourcesBaseUrl = "https://some/path/to/api/resources";

  beforeEach(() => {
    jest.clearAllMocks();
    checkRole.mockResolvedValue(true);
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);
  });

  function validSkillBody() {
    return JSON.stringify({
      preferredLabel: "Test Skill",
      originUri: "https://example.com/skill",
      UUIDHistory: [],
      altLabels: [],
      definition: "definition",
      description: "description",
      scopeNote: "scopeNote",
      modelId: givenModelId,
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    });
  }

  test("should return 201 and create a skill", async () => {
    const givenSkill: ISkill = getISkillMockData(1, givenModelId);
    const givenSkillServiceMock = {
      create: jest.fn().mockResolvedValue(givenSkill),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: validSkillBody(),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
  });

  test("should return 400 if modelId is invalid", async () => {
    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: "/models/invalid-uuid/skills",
      headers: { "Content-Type": "application/json" },
      body: validSkillBody(),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 400 if request body is invalid", async () => {
    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: "invalid json",
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 400 if JSON.parse throws a non-Error", async () => {
    const originalParse = JSON.parse;
    JSON.parse = jest.fn().mockImplementation(() => {
      throw "string error";
    });
    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: "some body",
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    JSON.parse = originalParse;
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 404 if model not found", async () => {
    const givenSkillServiceMock = {
      create: jest
        .fn()
        .mockRejectedValue(new SkillModelValidationError(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID)),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: validSkillBody(),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
  });

  test("should return 400 if model is released", async () => {
    const givenSkillServiceMock = {
      create: jest
        .fn()
        .mockRejectedValue(new SkillModelValidationError(ModelForSkillValidationErrorCode.MODEL_IS_RELEASED)),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: validSkillBody(),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 500 if service throws DB error", async () => {
    const givenSkillServiceMock = {
      create: jest
        .fn()
        .mockRejectedValue(new SkillModelValidationError(ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB)),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: validSkillBody(),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should return 500 on unexpected error", async () => {
    const givenSkillServiceMock = {
      create: jest.fn().mockRejectedValue(new Error("Unexpected error")),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: validSkillBody(),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should return 400 if media type is wrong", async () => {
    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ preferredLabel: "Test" }),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
  });

  test("should return 400 if body is null", async () => {
    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: null,
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 413 if body exceeds max payload length", async () => {
    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: "x".repeat(SkillAPISpecs.POST.Constants.MAX_PAYLOAD_LENGTH + 1),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
  });

  test("should return 400 if request body fails AJV schema validation", async () => {
    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredLabel: "Missing required fields" }),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 400 if route does not match", async () => {
    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: "/invalid/path",
      headers: { "Content-Type": "application/json" },
      body: validSkillBody(),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 400 if path is missing", async () => {
    const event = {
      httpMethod: HTTP_VERBS.POST,
      headers: { "Content-Type": "application/json" },
      body: validSkillBody(),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 500 for unknown ModelForSkillValidationErrorCode", async () => {
    const givenSkillServiceMock = {
      create: jest
        .fn()
        .mockRejectedValue(
          new SkillModelValidationError("UNKNOWN_ERROR_CODE" as unknown as ModelForSkillValidationErrorCode)
        ),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/skills`,
      headers: { "Content-Type": "application/json" },
      body: validSkillBody(),
    };
    const actualResponse = await postHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
