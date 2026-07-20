import "_test_utilities/consoleMock";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as skillHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import SkillAPISpecs from "api-specifications/esco/skill";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { ISkill } from "../../_shared/skill.types";
import { getISkillMockData } from "../../_shared/testDataHelper";
import {
  ISkillService,
  ModelForSkillValidationErrorCode,
  SkillModelValidationError,
} from "../../services/skill.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import * as config from "server/config/config";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const checkRole = jest.spyOn(authenticatorModule, "checkRole");

describe("Test for skill PATCH handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRole.mockResolvedValue(true);
    const mockServiceRegistry = {
      skill: {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkill: jest.fn(),
        update: jest.fn(),
        patch: jest.fn(),
        getParents: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getOccupations: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getRelatedSkills: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getHistory: jest.fn().mockResolvedValue(null),
      } as ISkillService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  test("should respond with FORBIDDEN if user is not a model manager", async () => {
    checkRole.mockResolvedValue(false);
    const givenModelId = getMockStringId(1);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "New Label" }),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${getMockStringId(2)}`,
      requestContext: usersRequestContext.REGISTED_USER,
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("should respond with OK and the updated skill when all patchable fields are provided", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const fullyPopulatedPayload = {
      preferredLabel: "Updated Preferred Label",
      originUri: "https://example.com/origin",
      altLabels: ["Alt 1", "Alt 2"],
      definition: "New definition",
      description: "New description",
      scopeNote: "New scope note",
      skillType: "knowledge",
      reuseLevel: "sector-specific",
      modelId: givenModelId,
      UUIDHistory: ["00000000-0000-0000-0000-000000000000"],
      isLocalized: true,
    };
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(fullyPopulatedPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce("https://some/path/to/api/resources");
    const givenSkill: ISkill = getISkillMockData(1, givenModelId);
    const givenSkillServiceMock = {
      patch: jest.fn().mockResolvedValue(givenSkill),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(givenSkillServiceMock.patch).toHaveBeenCalledWith(
      givenSkillId,
      givenModelId,
      expect.objectContaining(fullyPopulatedPayload)
    );
  });

  test("should respond with OK and the updated skill when only preferredLabel is provided", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Updated Preferred Label" }),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce("https://some/path/to/api/resources");
    const givenSkill: ISkill = getISkillMockData(1, givenModelId);
    const givenSkillServiceMock = {
      patch: jest.fn().mockResolvedValue(givenSkill),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(givenSkillServiceMock.patch).toHaveBeenCalledWith(
      givenSkillId,
      givenModelId,
      expect.objectContaining({ preferredLabel: "Updated Preferred Label" })
    );
    expect(JSON.parse(actualResponse.body).preferredLabel).toEqual(givenSkill.preferredLabel);
  });

  test("should respond with OK when an empty patch body is sent", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    } as unknown as APIGatewayProxyEvent;

    const givenSkill: ISkill = getISkillMockData(1, givenModelId);
    const givenSkillServiceMock = {
      patch: jest.fn().mockResolvedValue(givenSkill),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
  });

  test("should respond with NOT_FOUND when skill is not found", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      patch: jest.fn().mockResolvedValue(null),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(SkillAPISpecs.Skill.PATCH.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND);
  });

  test("should respond with NOT_FOUND when model is not found", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      patch: jest
        .fn()
        .mockRejectedValue(new SkillModelValidationError(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID)),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(SkillAPISpecs.Skill.PATCH.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND);
  });

  test("should respond with BAD_REQUEST when model is released", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      patch: jest
        .fn()
        .mockRejectedValue(new SkillModelValidationError(ModelForSkillValidationErrorCode.MODEL_IS_RELEASED)),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(
      SkillAPISpecs.Skill.PATCH.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL
    );
  });

  test("should respond with BAD_REQUEST when payload modelId does not match path", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ modelId: getMockStringId(99) }),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should respond with BAD_REQUEST when body is null", async () => {
    const givenModelId = getMockStringId(1);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: null,
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${getMockStringId(2)}`,
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should respond with UNSUPPORTED_MEDIA_TYPE when content-type is missing or invalid", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "text/plain" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
  });

  test("should respond with PAYLOAD_TOO_LARGE when body exceeds max length", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const largeBody = "a".repeat(SkillAPISpecs.Skill.PATCH.Constants.MAX_PATCH_PAYLOAD_LENGTH + 1);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: largeBody,
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
  });

  test("should respond with BAD_REQUEST when body is malformed JSON", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: "{ invalid_json: ",
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should respond with BAD_REQUEST when JSON.parse throws a non-Error", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: "{}", // valid json, but we mock the parse
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
      throw "Some string error";
    });

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should respond with BAD_REQUEST when body fails schema validation", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: 123 }), // Invalid type
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should respond with INTERNAL_SERVER_ERROR when model fetch fails", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      patch: jest
        .fn()
        .mockRejectedValue(new SkillModelValidationError(ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB)),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should respond with INTERNAL_SERVER_ERROR when an unknown validation error occurs", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      patch: jest.fn().mockRejectedValue(new SkillModelValidationError("UNKNOWN" as never)),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should respond with INTERNAL_SERVER_ERROR when an unknown error occurs", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      patch: jest.fn().mockRejectedValue(new Error("Unknown error")),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should respond with BAD_REQUEST when invalid path params are provided", async () => {
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "application/json" },
      path: `/models/invalid-id/skills/invalid-id`,
      pathParameters: { modelId: "invalid-id", id: "invalid-id" },
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });
});
