import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "esco/skill/_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as patchOccupationSkillsHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getISkillMockData } from "esco/skill/_shared/testDataHelper";
import { ModelForOccupationValidationErrorCode } from "esco/occupations/services/occupation.service.types";
import { ISkillWithRelation } from "esco/occupations/_shared/occupation.types";
import {
  SkillForOccupationValidationErrorCode,
  OccupationSkillValidationError,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { SignallingValueLabel } from "esco/common/objectTypes";
import { ajvInstance } from "validator";

let checkRole: jest.SpyInstance;
let transformSkillSpy: jest.SpyInstance;

// Mock service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation Skills PATCH handler", () => {
  let mockServiceRegistry: {
    occupation: {
      validateModelForOccupation: jest.Mock;
    };
    occupationToSkillRelation: {
      updateSkill: jest.Mock;
    };
    initialize: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    checkRole = jest.spyOn(authenticatorModule, "checkRole").mockResolvedValue(true);
    transformSkillSpy = jest.spyOn(transformModule, "transform");

    mockServiceRegistry = {
      occupation: {
        validateModelForOccupation: jest.fn(),
      },
      occupationToSkillRelation: {
        updateSkill: jest.fn(),
      },
      initialize: jest.fn(),
    };
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry as unknown as ServiceRegistry);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("PATCH /models/{modelId}/occupations/{id}/skills", () => {
    describe("Security tests", () => {
      test("should respond with FORBIDDEN status code if a user is not a model manager", async () => {
        const givenRequestContext = usersRequestContext.REGISTED_USER;
        checkRole.mockResolvedValue(false);

        const givenEvent: APIGatewayProxyEvent = {
          httpMethod: HTTP_VERBS.PATCH,
          body: JSON.stringify({ requiredSkillId: getMockStringId(3) }),
          headers: { "Content-Type": "application/json" },
          requestContext: givenRequestContext,
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await patchOccupationSkillsHandler(givenEvent);
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("should respond with OK status code and transformed skill for valid ESCO input", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenSkillId = getMockStringId(3);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);

      const mockSkill: ISkillWithRelation = {
        ...getISkillMockData(2),
        id: givenSkillId,
        relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        signallingValueLabel: SignallingValueLabel.NONE,
        signallingValue: null,
      };

      mockServiceRegistry.occupationToSkillRelation.updateSkill.mockResolvedValue(mockSkill);

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(mockServiceRegistry.occupationToSkillRelation.updateSkill).toHaveBeenCalledWith(
        givenModelId,
        givenOccupationId,
        givenSkillId,
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        SignallingValueLabel.NONE,
        null
      );
      expect(transformSkillSpy).toHaveBeenCalledWith(mockSkill, givenResourcesBaseUrl);
    });

    test("should respond with OK status code and transformed skill when content-type has lowercase key", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenSkillId = getMockStringId(3);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);

      const mockSkill: ISkillWithRelation = {
        ...getISkillMockData(2),
        id: givenSkillId,
        relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        signallingValueLabel: SignallingValueLabel.NONE,
        signallingValue: null,
      };

      mockServiceRegistry.occupationToSkillRelation.updateSkill.mockResolvedValue(mockSkill);

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    });

    test("should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "PATCH",
        path: "/models/invalid-id/occupations/invalid-id/skills",
        pathParameters: { modelId: "invalid-id", id: "invalid-id" },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiredSkillId: getMockStringId(3) }),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is empty", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when Content-Type is invalid", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ requiredSkillId: getMockStringId(3) }),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when headers object is undefined", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: undefined,
        body: JSON.stringify({ requiredSkillId: getMockStringId(3) }),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with BAD_REQUEST when schema validation fails", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: "invalid-id",
        }),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with TOO_LARGE_PAYLOAD when body is too long", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "a".repeat(OccupationAPISpecs.Constants.MAX_PAYLOAD_LENGTH + 1),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "{",
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with INTERNAL_SERVER_ERROR if AJV getSchema returns undefined", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiredSkillId: getMockStringId(3) }),
      } as unknown as APIGatewayProxyEvent;

      const originalGetSchema = ajvInstance.getSchema.bind(ajvInstance);
      const getSchemaSpy = jest.spyOn(ajvInstance, "getSchema").mockImplementation((schemaId: string) => {
        if (schemaId === OccupationAPISpecs.Occupation.Skills.PATCH.Schemas.Request.Payload.$id) {
          return undefined;
        }
        return originalGetSchema(schemaId);
      });

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      getSchemaSpy.mockRestore();
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(
        ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID
      );

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
      });
    });

    test("should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(
        ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB
      );

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_UPDATE_OCCUPATION_SKILL_RELATION,
      });
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(
        ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED
      );

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
      });
    });

    test("should respond with NOT_FOUND when requiring occupation is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.updateSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND)
      );

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
      });
    });

    test("should respond with NOT_FOUND when required skill is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.updateSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND)
      );

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
      });
    });

    test("should respond with BAD_REQUEST when ESCO occupation lacks relationType", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.updateSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE)
      );

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status400.ErrorCodes.INVALID_RELATION_TYPE,
      });
    });

    test("should respond with BAD_REQUEST when ESCO occupation has signallingValueLabel", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.updateSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_SIGNALLING_VALUE_LABEL)
      );

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status400.ErrorCodes.INVALID_SIGNALLING_VALUE_LABEL,
      });
    });

    test("should respond with BAD_REQUEST when relation code is inconsistent", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.updateSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.RELATION_CODE_INCONSISTENT)
      );

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status400.ErrorCodes.RELATION_CODE_INCONSISTENT,
      });
    });

    test("should respond with BAD_REQUEST when Local occupation has both relationType and signallingValueLabel", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.updateSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.MUTUALLY_EXCLUSIVE_VALUES)
      );

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status400.ErrorCodes.MUTUALLY_EXCLUSIVE_VALUES,
      });
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.updateSkill.mockRejectedValue(new Error("generic error"));

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_UPDATE_OCCUPATION_SKILL_RELATION,
      });
    });

    test("should respond with BAD_REQUEST when body is not valid JSON and JSON.parse throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "{",
      } as unknown as APIGatewayProxyEvent;

      const parseSpy = jest.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string parse error";
      });

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      parseSpy.mockRestore();
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save (generic non-Error)", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "PATCH",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.updateSkill.mockRejectedValue("string generic DB error");

      const actualResponse = await patchOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Skills.PATCH.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_UPDATE_OCCUPATION_SKILL_RELATION,
      });
    });
  });
});
