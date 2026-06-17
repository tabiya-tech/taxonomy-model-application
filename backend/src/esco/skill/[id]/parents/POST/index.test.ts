import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "esco/skill/_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as postSkillParentsHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { ObjectTypes } from "esco/common/objectTypes";
import { ISkill } from "esco/skill/_shared/skill.types";
import { getISkillMockData } from "esco/skill/_shared/testDataHelper";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { getIOccupationGroupMockData as getISkillGroupMockData } from "esco/occupationGroup/_shared/testDataHelper"; // Mock skill group has same fields
import { ISkillService } from "esco/skill/services/skill.service.types";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { buildParentResponse } from "./response";
import SkillAPISpecs from "api-specifications/esco/skill";
import {
  ParentForSkillValidationErrorCode,
  SkillParentValidationError,
} from "esco/skillHierarchy/skillHierarchy.service.types";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformDynamicEntitySpy = jest.spyOn(transformModule, "transformDynamicEntity");

// Mock service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

// Mock repository registry
jest.mock("server/repositoryRegistry/repositoryRegistry");
const mockGetRepositoryRegistry = jest.mocked(getRepositoryRegistry);

describe("Test for skill Parents POST handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockServiceRegistry = {
      skill: {
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService,
      skillHierarchy: {
        setParent: jest.fn(),
      },
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);

    const mockRepositoryRegistry = {
      skill: {
        Model: {
          findOne: jest.fn(),
        },
      },
      skillGroup: {
        Model: {
          findOne: jest.fn(),
        },
      },
      skillHierarchy: {
        hierarchyModel: {
          findOneAndUpdate: jest.fn(),
        },
      },
    } as unknown as RepositoryRegistry;
    mockGetRepositoryRegistry.mockReturnValue(mockRepositoryRegistry);
  });

  describe("POST /models/{modelId}/skills/{id}/parents", () => {
    describe("Security tests", () => {
      test("should respond with FORBIDDEN status code if a user is not a model manager", async () => {
        const givenRequestContext = usersRequestContext.REGISTED_USER;
        checkRole.mockResolvedValue(false);

        const givenEvent: APIGatewayProxyEvent = {
          httpMethod: HTTP_VERBS.POST,
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
          requestContext: givenRequestContext,
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await postSkillParentsHandler(givenEvent);
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("should respond with CREATED status code and transformed parent for valid input (Skill parent)", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenParentId = getMockStringId(3);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = givenParentId;

      const mockHierarchyService = mockGetServiceRegistry().skillHierarchy;
      (mockHierarchyService.setParent as jest.Mock).mockResolvedValue(mockParent);

      const actualResponse = await postSkillParentsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(transformModule.transformDynamicEntity).toHaveBeenCalledWith(mockParent, givenResourcesBaseUrl);
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformDynamicEntitySpy.mock.results[0].value);
    });

    test("should respond with CREATED status code and transformed parent for valid input (SkillGroup parent)", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);
      const givenParentId = getMockStringId(3);
      const RouterResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(RouterResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.SkillGroup,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockParent = getISkillGroupMockData(1) as unknown as ISkillGroup;
      mockParent.id = givenParentId;

      const mockHierarchyService = mockGetServiceRegistry().skillHierarchy;
      (mockHierarchyService.setParent as jest.Mock).mockResolvedValue(mockParent);

      const actualResponse = await postSkillParentsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(transformModule.transformDynamicEntity).toHaveBeenCalledWith(mockParent, RouterResourcesBaseUrl);
    });

    test("should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "POST",
        path: "/models/invalid-id/skills/invalid-id/parents",
        pathParameters: { modelId: "invalid-id", id: "invalid-id" },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: getMockStringId(3),
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is empty", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when Content-Type is invalid", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: RouterModelId, id: RouterSkillId },
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({}),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillParentsHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with BAD_REQUEST when schema validation fails", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: RouterModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: "invalid-id-too-short",
          parentType: "invalid-type",
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillParentsHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with TOO_LARGE_PAYLOAD when body is too long", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(SkillAPISpecs.POST.Constants.MAX_PAYLOAD_LENGTH + 1),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON and JSON.parse throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const jsonParseSpy = jest.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string error";
      });

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      jsonParseSpy.mockRestore();
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: RouterModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: getMockStringId(3),
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID
      );

      const actualResponse = await postSkillParentsHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: getMockStringId(3),
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB
      );

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: getMockStringId(3),
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.MODEL_IS_RELEASED
      );

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with NOT_FOUND when child skill is not found", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: getMockStringId(3),
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockHierarchyService = mockGetServiceRegistry().skillHierarchy;
      (mockHierarchyService.setParent as jest.Mock).mockRejectedValue(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.SKILL_NOT_FOUND)
      );

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with NOT_FOUND when parent is not found", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);
      const RouterParentId = getMockStringId(3);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: RouterModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: RouterParentId,
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const RouterSkillServiceMock = mockGetServiceRegistry().skill;
      (RouterSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockHierarchyService = mockGetServiceRegistry().skillHierarchy;
      (mockHierarchyService.setParent as jest.Mock).mockRejectedValue(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND)
      );

      const actualResponse = await postSkillParentsHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);
      const givenParentId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockHierarchyService = mockGetServiceRegistry().skillHierarchy;
      (mockHierarchyService.setParent as jest.Mock).mockRejectedValue(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.DB_FAILED_TO_CREATE_SKILL_PARENT)
      );

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save (Error instance)", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);
      const givenParentId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockHierarchyService = mockGetServiceRegistry().skillHierarchy;
      (mockHierarchyService.setParent as jest.Mock).mockRejectedValue(new Error("DB Connection Error"));

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with BAD_REQUEST when parent-child code is inconsistent", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenParentId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockHierarchyService = mockGetServiceRegistry().skillHierarchy;
      (mockHierarchyService.setParent as jest.Mock).mockRejectedValue(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT)
      );

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with INTERNAL_SERVER_ERROR when service throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenParentId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.Skill,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockHierarchyService = mockGetServiceRegistry().skillHierarchy;
      (mockHierarchyService.setParent as jest.Mock).mockRejectedValue("string error");

      const actualResponse = await postSkillParentsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe("buildParentResponse", () => {
    test("should return null if parent is null", () => {
      const result = buildParentResponse(null, "https://example.com");
      expect(result).toBeNull();
    });
  });
});
