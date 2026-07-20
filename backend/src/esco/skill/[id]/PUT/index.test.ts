import "_test_utilities/consoleMock";
import * as config from "server/config/config";
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
import { randomUUID } from "node:crypto";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const checkRole = jest.spyOn(authenticatorModule, "checkRole");

const givenValidPayload = (): SkillAPISpecs.Skill.PUT.Types.Request.Payload => ({
  modelId: getMockStringId(1),
  preferredLabel: "Updated Skill",
  originUri: `http://example.com/skills/${randomUUID()}`,
  UUIDHistory: [randomUUID()],
  altLabels: ["Alt label"],
  definition: "Definition",
  description: "Description",
  scopeNote: "Scope note",
  skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
  reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
  isLocalized: false,
});

describe("Test for skill PUT handler", () => {
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
    const givenPayload = givenValidPayload();
    givenPayload.modelId = givenModelId;
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${getMockStringId(2)}`,
      requestContext: usersRequestContext.REGISTED_USER,
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("should respond with OK and the updated skill for a valid request", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenPayload = givenValidPayload();
    givenPayload.modelId = givenModelId;
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce("https://some/path/to/api/resources");
    const givenSkill: ISkill = getISkillMockData(1, givenModelId);
    const givenSkillServiceMock = {
      update: jest.fn().mockResolvedValue(givenSkill),
      patch: jest.fn(),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(actualResponse.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(givenSkillServiceMock.update).toHaveBeenCalledWith(
      givenSkillId,
      givenModelId,
      expect.objectContaining({ preferredLabel: "Updated Skill" })
    );
    expect(JSON.parse(actualResponse.body).preferredLabel).toEqual(givenSkill.preferredLabel);
  });

  test("should respond with NOT_FOUND when skill is not found", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenPayload = givenValidPayload();
    givenPayload.modelId = givenModelId;
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      update: jest.fn().mockResolvedValue(null),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(SkillAPISpecs.Skill.PUT.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND);
  });

  test("should respond with NOT_FOUND when model is not found", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenPayload = givenValidPayload();
    givenPayload.modelId = givenModelId;
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      update: jest
        .fn()
        .mockRejectedValue(new SkillModelValidationError(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID)),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(SkillAPISpecs.Skill.PUT.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND);
  });

  test("should respond with BAD_REQUEST when model is released", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenPayload = givenValidPayload();
    givenPayload.modelId = givenModelId;
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      update: jest
        .fn()
        .mockRejectedValue(new SkillModelValidationError(ModelForSkillValidationErrorCode.MODEL_IS_RELEASED)),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(SkillAPISpecs.Skill.PUT.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL);
  });

  test("should respond with BAD_REQUEST when payload modelId does not match path", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenPayload = givenValidPayload();
    givenPayload.modelId = getMockStringId(99);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should respond with the appropriate error when parseAndValidatePUTRequest fails (null body)", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: null,
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should respond with BAD_REQUEST when path parameters are invalid", async () => {
    const givenPayload = givenValidPayload();
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/invalid-id/skills/invalid-id`,
      pathParameters: { modelId: "invalid-id", id: "invalid-id" },
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should respond with INTERNAL_SERVER_ERROR when FAILED_TO_FETCH_FROM_DB", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenPayload = givenValidPayload();
    givenPayload.modelId = givenModelId;
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      update: jest
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
    const givenPayload = givenValidPayload();
    givenPayload.modelId = givenModelId;
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      update: jest.fn().mockRejectedValue(new SkillModelValidationError("UNKNOWN" as never)),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should respond with INTERNAL_SERVER_ERROR when a generic (non-validation) error occurs", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenPayload = givenValidPayload();
    givenPayload.modelId = givenModelId;
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const givenSkillServiceMock = {
      update: jest.fn().mockRejectedValue(new Error("Generic error")),
    } as unknown as ISkillService;
    mockGetServiceRegistry().skill = givenSkillServiceMock;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should respond with UNSUPPORTED_MEDIA_TYPE when content-type is invalid", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenPayload = givenValidPayload();
    givenPayload.modelId = givenModelId;
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "text/plain" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
  });

  test("should respond with TOO_LARGE_PAYLOAD when body exceeds max length", async () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const largeBody = "a".repeat(SkillAPISpecs.Skill.PUT.Constants.MAX_PUT_PAYLOAD_LENGTH + 1);
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.PUT,
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
      httpMethod: HTTP_VERBS.PUT,
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
      httpMethod: HTTP_VERBS.PUT,
      body: "{}",
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
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify({ preferredLabel: 123 }), // Missing required fields / wrong types
      headers: { "Content-Type": "application/json" },
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
      pathParameters: { modelId: givenModelId, id: givenSkillId },
    } as unknown as APIGatewayProxyEvent;

    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });
});
