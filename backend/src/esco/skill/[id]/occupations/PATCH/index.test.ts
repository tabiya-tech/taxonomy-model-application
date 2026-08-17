import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "esco/skill/_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as patchSkillOccupationsHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getIOccupationMockData } from "esco/occupations/_shared/testDataHelper";
import { ISkillService } from "esco/skill/services/skill.service.types";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ajvInstance } from "validator";
import SkillAPISpecs from "api-specifications/esco/skill";
import { SignallingValueLabel } from "esco/common/objectTypes";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  OccupationSkillValidationError,
  SkillForOccupationValidationErrorCode,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.service.types";

jest.spyOn(transformModule, "transformSkillOccupation");

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

// Mock service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for skill Occupations PATCH handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockServiceRegistry = {
      skill: {
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService,
      occupationToSkillRelation: {
        updateOccupation: jest.fn(),
      },
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("PATCH /models/{modelId}/skills/{id}/occupations", () => {
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

        const actualResponse = await patchSkillOccupationsHandler(givenEvent);
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("should respond with OK status code and transformed occupation for valid ESCO input", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenOccupationId = getMockStringId(3);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: givenOccupationId,
          relationType: SkillAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockOccupation = {
        ...getIOccupationMockData(2),
        id: givenOccupationId,
        occupationType: ObjectTypes.ESCOOccupation,
      };

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockResolvedValue({
        ...mockOccupation,
        relationType: SkillAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        signallingValue: null,
        signallingValueLabel: SignallingValueLabel.NONE,
      });

      // Invoke handler
      const actualResponse = await patchSkillOccupationsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(mockRelationService.updateOccupation).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        givenOccupationId,
        SkillAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        SignallingValueLabel.NONE,
        null
      );
      expect(transformModule.transformSkillOccupation).toHaveBeenCalledWith(
        expect.objectContaining({ id: givenOccupationId }),
        givenResourcesBaseUrl
      );
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        id: givenOccupationId,
        relationType: SkillAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        signallingValueLabel: SignallingValueLabel.NONE,
      });
    });

    test("should respond with OK status code for valid Local Occupation input with signalling value", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenOccupationId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: givenOccupationId,
          relationType: SkillAPISpecs.Enums.OccupationToSkillRelationType.NONE,
          signallingValueLabel: SignallingValueLabel.HIGH,
          signallingValue: 5,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockOccupation = {
        ...getIOccupationMockData(2),
        id: givenOccupationId,
        occupationType: ObjectTypes.LocalOccupation,
      };

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockResolvedValue({
        ...mockOccupation,
        relationType: SkillAPISpecs.Enums.OccupationToSkillRelationType.NONE,
        signallingValue: 5,
        signallingValueLabel: SignallingValueLabel.HIGH,
      });

      // Invoke handler
      const actualResponse = await patchSkillOccupationsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(mockRelationService.updateOccupation).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        givenOccupationId,
        SkillAPISpecs.Enums.OccupationToSkillRelationType.NONE,
        SignallingValueLabel.HIGH,
        5
      );
    });

    test("should respond with OK status code using default relation values when not provided", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenOccupationId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: givenOccupationId,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockOccupation = {
        ...getIOccupationMockData(2),
        id: givenOccupationId,
        occupationType: ObjectTypes.ESCOOccupation,
      };

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockResolvedValue({
        ...mockOccupation,
        relationType: SkillAPISpecs.Enums.OccupationToSkillRelationType.NONE,
        signallingValue: null,
        signallingValueLabel: SignallingValueLabel.NONE,
      });

      // Invoke handler
      const actualResponse = await patchSkillOccupationsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(mockRelationService.updateOccupation).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        givenOccupationId,
        SkillAPISpecs.Enums.OccupationToSkillRelationType.NONE,
        SignallingValueLabel.NONE,
        null
      );
    });

    test("should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "PATCH",
        path: "/models/invalid-id/skills/invalid-id/occupations",
        pathParameters: { modelId: "invalid-id", id: "invalid-id" },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
          relationType: SkillAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is empty", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when Content-Type is invalid", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with BAD_REQUEST when schema validation fails", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: "too-short",
          relationType: "invalid-type",
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with INTERNAL_SERVER_ERROR if AJV getSchema returns undefined", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      const originalGetSchema = ajvInstance.getSchema.bind(ajvInstance);
      const getSchemaSpy = jest.spyOn(ajvInstance, "getSchema").mockImplementation((schemaId: string) => {
        if (schemaId === SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload.$id) {
          return undefined;
        }
        return originalGetSchema(schemaId);
      });

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      getSchemaSpy.mockRestore();
    });

    test("should respond with TOO_LARGE_PAYLOAD when body is too long", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(SkillAPISpecs.Constants.RELATION_MAX_PAYLOAD_LENGTH + 1),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON and JSON.parse throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const jsonParseSpy = jest.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string error";
      });

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      jsonParseSpy.mockRestore();
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID
      );

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB
      );

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(
        ModelForSkillValidationErrorCode.MODEL_IS_RELEASED
      );

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with NOT_FOUND when required skill is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenOccupationId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: givenOccupationId,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND)
      );

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with NOT_FOUND when requiring occupation is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenOccupationId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: givenOccupationId,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND)
      );

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with BAD_REQUEST when relation type is invalid", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE)
      );

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when signalling value label is invalid", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_SIGNALLING_VALUE_LABEL)
      );

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when relation code is inconsistent", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.RELATION_CODE_INCONSISTENT)
      );

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when values are mutually exclusive", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.MUTUALLY_EXCLUSIVE_VALUES)
      );

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during update", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockRejectedValue(new Error("DB Connection Error"));

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with INTERNAL_SERVER_ERROR when service throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        pathParameters: { modelId: givenModelId, id: givenSkillId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiringOccupationId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = mockGetServiceRegistry().skill;
      (givenSkillServiceMock.validateModelForSkill as jest.Mock).mockResolvedValue(null);

      const mockRelationService = mockGetServiceRegistry().occupationToSkillRelation;
      (mockRelationService.updateOccupation as jest.Mock).mockRejectedValue("string error");

      const actualResponse = await patchSkillOccupationsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});
