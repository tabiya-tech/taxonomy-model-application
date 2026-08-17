import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "esco/skill/_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as patchSkillRelatedHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { ISkill } from "esco/skill/_shared/skill.types";
import { getISkillMockData } from "esco/skill/_shared/testDataHelper";
import { ISkillService } from "esco/skill/services/skill.service.types";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ajvInstance } from "validator";
import SkillAPISpecs from "api-specifications/esco/skill";
import {
  SkillToSkillRelationValidationErrorCode,
  SkillToSkillRelationValidationError,
} from "esco/skillToSkillRelation/skillToSkillRelation.service.types";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformSkillRelatedSpy = jest.spyOn(transformModule, "transformSkillRelated");

// Mock service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for skill Related PATCH handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockServiceRegistry = {
      skill: {
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService,
      skillToSkillRelation: {
        updateRelatedSkill: jest.fn(),
      },
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("PATCH /models/{modelId}/skills/{id}/related", () => {
    describe("Security tests", () => {
      test("should respond with FORBIDDEN status code if a user is not a model manager", async () => {
        const givenRequestContext = usersRequestContext.REGISTED_USER;
        checkRole.mockResolvedValue(false);

        const givenEvent: APIGatewayProxyEvent = {
          httpMethod: HTTP_VERBS.PATCH,
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
          requestContext: givenRequestContext,
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await patchSkillRelatedHandler(givenEvent);
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("should respond with OK status code and transformed skill for valid input", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenRequiredSkillId = getMockStringId(3);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenRequiredSkillId,
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockSkill = getISkillMockData(2) as ISkill & { relationType: string };
      mockSkill.id = givenRequiredSkillId;
      mockSkill.relationType = "essential";

      const mockRelationService = mockGetServiceRegistry().skillToSkillRelation;
      (mockRelationService.updateRelatedSkill as jest.Mock).mockResolvedValue(mockSkill);

      // Invoke handler
      const actualResponse = await patchSkillRelatedHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(transformModule.transformSkillRelated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockSkill.id,
        }),
        givenResourcesBaseUrl
      );
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        ...transformSkillRelatedSpy.mock.results[0].value,
        id: mockSkill.id,
        relationType: "essential",
      });
    });

    test("should respond with OK status code when relationType is not provided", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenRequiredSkillId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenRequiredSkillId,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockSkill = getISkillMockData(2) as ISkill & { relationType: string };
      mockSkill.id = givenRequiredSkillId;
      mockSkill.relationType = "optional";

      const mockRelationService = mockGetServiceRegistry().skillToSkillRelation;
      (mockRelationService.updateRelatedSkill as jest.Mock).mockResolvedValue(mockSkill);

      const actualResponse = await patchSkillRelatedHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(mockRelationService.updateRelatedSkill).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        givenRequiredSkillId,
        undefined
      );
    });

    test("should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "PATCH",
        path: "/models/invalid-id/skills/invalid-id/related",
        pathParameters: { modelId: "invalid-id", id: "invalid-id" },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is empty", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when Content-Type is invalid", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with BAD_REQUEST when schema validation fails", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: "too-short",
          relationType: "invalid-type",
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with INTERNAL_SERVER_ERROR if AJV getSchema returns undefined", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      const originalGetSchema = ajvInstance.getSchema.bind(ajvInstance);
      const getSchemaSpy = jest.spyOn(ajvInstance, "getSchema").mockImplementation((schemaId: string) => {
        if (schemaId === SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload.$id) {
          return undefined;
        }
        return originalGetSchema(schemaId);
      });

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      getSchemaSpy.mockRestore();
    });

    test("should respond with TOO_LARGE_PAYLOAD when body is too long", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(SkillAPISpecs.Constants.RELATION_MAX_PAYLOAD_LENGTH + 1),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON and JSON.parse throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const jsonParseSpy = jest.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string error";
      });

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      jsonParseSpy.mockRestore();
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID
      );

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB
      );

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.MODEL_IS_RELEASED
      );

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with NOT_FOUND when requiring skill is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().skillToSkillRelation;
      (mockRelationService.updateRelatedSkill as jest.Mock).mockRejectedValue(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.SKILL_NOT_FOUND)
      );

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with NOT_FOUND when required skill is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().skillToSkillRelation;
      (mockRelationService.updateRelatedSkill as jest.Mock).mockRejectedValue(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATED_SKILL_NOT_FOUND)
      );

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during update", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().skillToSkillRelation;
      (mockRelationService.updateRelatedSkill as jest.Mock).mockRejectedValue(
        new SkillToSkillRelationValidationError(
          SkillToSkillRelationValidationErrorCode.DB_FAILED_TO_UPDATE_SKILL_RELATION
        )
      );

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with INTERNAL_SERVER_ERROR when an Error instance occurs during update", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().skillToSkillRelation;
      (mockRelationService.updateRelatedSkill as jest.Mock).mockRejectedValue(new Error("DB Connection Error"));

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with INTERNAL_SERVER_ERROR when service throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().skillToSkillRelation;
      (mockRelationService.updateRelatedSkill as jest.Mock).mockRejectedValue("string error");

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with BAD_REQUEST when relation code is inconsistent", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().skillToSkillRelation;
      (mockRelationService.updateRelatedSkill as jest.Mock).mockRejectedValue(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATION_CODE_INCONSISTENT)
      );

      const actualResponse = await patchSkillRelatedHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
  });
});
