import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "esco/skill/_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as postSkillRelatedHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { ISkill } from "esco/skill/_shared/skill.types";
import { getISkillMockData } from "esco/skill/_shared/testDataHelper";
import { ISkillService } from "esco/skill/services/skill.service.types";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { buildRelatedResponse } from "./response";
import SkillAPISpecs from "api-specifications/esco/skill";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformSkillRelatedSpy = jest.spyOn(transformModule, "transformSkillRelated");

// Mock service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

// Mock repository registry
jest.mock("server/repositoryRegistry/repositoryRegistry");
const mockGetRepositoryRegistry = jest.mocked(getRepositoryRegistry);

describe("Test for skill Related POST handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockServiceRegistry = {
      skill: {
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);

    const mockRepositoryRegistry = {
      skill: {
        Model: {
          findOne: jest.fn(),
        },
      },
      skillToSkillRelation: {
        relationModel: {
          findOneAndUpdate: jest.fn(),
        },
      },
    } as unknown as RepositoryRegistry;
    mockGetRepositoryRegistry.mockReturnValue(mockRepositoryRegistry);
  });

  describe("POST /models/{modelId}/skills/{id}/related", () => {
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

        const actualResponse = await postSkillRelatedHandler(givenEvent);
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("should respond with CREATED status code and transformed skill for valid input", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenRequiredSkillId = getMockStringId(3);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenRequiredSkillId,
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      // Mock validateModelForSkill success
      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      // Mock child findOne
      const mockChild = getISkillMockData(1) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenSkillId;
      mockChild._id = givenSkillId;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockParent.id = givenRequiredSkillId;
      mockParent._id = givenRequiredSkillId;
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild), // first call for requiring skill
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent), // second call for required skill
        });

      // Mock findOneAndUpdate
      const mockRelationModel = mockGetRepositoryRegistry().skillToSkillRelation.relationModel;
      (mockRelationModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      // Invoke handler
      const actualResponse = await postSkillRelatedHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(transformModule.transformSkillRelated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockParent.id,
        }),
        givenResourcesBaseUrl
      );
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        ...transformSkillRelatedSpy.mock.results[0].value,
        relationType: "essential",
      });
    });

    test("should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "POST",
        path: "/models/invalid-id/skills/invalid-id/related",
        pathParameters: { modelId: "invalid-id", id: "invalid-id" },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is empty", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when Content-Type is invalid", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: RouterModelId, id: RouterSkillId },
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({}),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillRelatedHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with BAD_REQUEST when schema validation fails", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: RouterModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: "too-short",
          relationType: "invalid-type",
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillRelatedHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with TOO_LARGE_PAYLOAD when body is too long", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(SkillAPISpecs.POST.Constants.MAX_PAYLOAD_LENGTH + 1),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON and JSON.parse throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const jsonParseSpy = jest.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string error";
      });

      const actualResponse = await postSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      jsonParseSpy.mockRestore();
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: RouterModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID
      );

      const actualResponse = await postSkillRelatedHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB
      );

      const actualResponse = await postSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.MODEL_IS_RELEASED
      );

      const actualResponse = await postSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with NOT_FOUND when child skill is not found", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const actualResponse = await postSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with NOT_FOUND when required skill is not found", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);
      const RouterRequiredSkillId = getMockStringId(3);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: RouterModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: RouterRequiredSkillId,
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const RouterSkillServiceMock = mockGetServiceRegistry().skill;
      (RouterSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockChild = getISkillMockData(1) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterSkillId;
      mockChild._id = RouterSkillId;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild), // first call for child
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null), // second call for parent (not found)
        });

      const actualResponse = await postSkillRelatedHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);
      const givenParentId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenParentId,
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockChild = getISkillMockData(1) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterSkillId;
      mockChild._id = RouterSkillId;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockParent.id = givenParentId;
      mockParent._id = givenParentId;
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent),
        });

      const mockRelationModel = mockGetRepositoryRegistry().skillToSkillRelation.relationModel;
      (mockRelationModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue("string error"),
      });

      const actualResponse = await postSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save (Error instance)", async () => {
      const givenModelId = getMockStringId(1);
      const RouterSkillId = getMockStringId(2);
      const givenParentId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/skills/${RouterSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: RouterSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenParentId,
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockChild = getISkillMockData(1) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterSkillId;
      mockChild._id = RouterSkillId;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockParent.id = givenParentId;
      mockParent._id = givenParentId;
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent),
        });

      const mockRelationModel = mockGetRepositoryRegistry().skillToSkillRelation.relationModel;
      (mockRelationModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error("DB Connection Error")),
      });

      const actualResponse = await postSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe("buildRelatedResponse", () => {
    test("should return null if parent is null", () => {
      const result = buildRelatedResponse(null as unknown as null, "https://example.com");
      expect(result).toBeNull();
    });
  });
});
