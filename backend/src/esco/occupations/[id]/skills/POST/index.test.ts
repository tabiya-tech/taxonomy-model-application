import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "esco/skill/_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as postOccupationSkillsHandler } from "./index";
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
import "_test_utilities/consoleMock";

let checkRole: jest.SpyInstance;
let transformSkillSpy: jest.SpyInstance;

// Mock service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation Skills POST handler", () => {
  let mockServiceRegistry: {
    occupation: {
      validateModelForOccupation: jest.Mock;
    };
    occupationToSkillRelation: {
      addSkill: jest.Mock;
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
        addSkill: jest.fn(),
      },
      initialize: jest.fn(),
    };
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry as unknown as ServiceRegistry);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /models/{modelId}/occupations/{id}/skills", () => {
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

        const actualResponse = await postOccupationSkillsHandler(givenEvent);
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("should respond with CREATED status code and transformed skill for valid ESCO input", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenSkillId = getMockStringId(3);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "POST",
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

      mockServiceRegistry.occupationToSkillRelation.addSkill.mockResolvedValue(mockSkill);

      const actualResponse = await postOccupationSkillsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(mockServiceRegistry.occupationToSkillRelation.addSkill).toHaveBeenCalledWith(
        givenModelId,
        givenOccupationId,
        givenSkillId,
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        SignallingValueLabel.NONE,
        null
      );
      expect(transformSkillSpy).toHaveBeenCalledWith(mockSkill, givenResourcesBaseUrl);
    });

    test("should respond with CREATED status code and transformed skill for valid Local Occupation input with relationType", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);
      const givenSkillId = getMockStringId(3);
      const RouterResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(RouterResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.OPTIONAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);

      const mockSkill: ISkillWithRelation = {
        ...getISkillMockData(2),
        id: givenSkillId,
        relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.OPTIONAL,
        signallingValueLabel: SignallingValueLabel.NONE,
        signallingValue: null,
      };

      mockServiceRegistry.occupationToSkillRelation.addSkill.mockResolvedValue(mockSkill);

      const actualResponse = await postOccupationSkillsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(mockServiceRegistry.occupationToSkillRelation.addSkill).toHaveBeenCalledWith(
        givenModelId,
        RouterOccupationId,
        givenSkillId,
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.OPTIONAL,
        SignallingValueLabel.NONE,
        null
      );
      expect(transformSkillSpy).toHaveBeenCalledWith(mockSkill, RouterResourcesBaseUrl);
    });

    test("should respond with CREATED status code and transformed skill for valid Local Occupation input with signalling value", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenSkillId = getMockStringId(3);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE,
          signallingValueLabel: SignallingValueLabel.HIGH,
          signallingValue: 0.5,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);

      const mockSkill: ISkillWithRelation = {
        ...getISkillMockData(2),
        id: givenSkillId,
        relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE,
        signallingValueLabel: SignallingValueLabel.HIGH,
        signallingValue: 0.5,
      };

      mockServiceRegistry.occupationToSkillRelation.addSkill.mockResolvedValue(mockSkill);

      const actualResponse = await postOccupationSkillsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(mockServiceRegistry.occupationToSkillRelation.addSkill).toHaveBeenCalledWith(
        givenModelId,
        givenOccupationId,
        givenSkillId,
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE,
        SignallingValueLabel.HIGH,
        0.5
      );
      expect(transformSkillSpy).toHaveBeenCalledWith(mockSkill, givenResourcesBaseUrl);
    });

    test("should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "POST",
        path: "/models/invalid-id/occupations/invalid-id/skills",
        pathParameters: { modelId: "invalid-id", id: "invalid-id" },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is empty", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: RouterModelId(), id: RouterOccupationId() },
        headers: { "Content-Type": "application/json" },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when Content-Type is invalid", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: RouterModelId(), id: RouterOccupationId() },
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({}),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with BAD_REQUEST when schema validation fails", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: RouterModelId(), id: RouterOccupationId() },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: "invalid-id",
        }),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with TOO_LARGE_PAYLOAD when body is too long", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: RouterModelId(), id: RouterOccupationId() },
        headers: { "Content-Type": "application/json" },
        body: "a".repeat(OccupationAPISpecs.Constants.MAX_PAYLOAD_LENGTH + 1),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: RouterModelId(), id: RouterOccupationId() },
        headers: { "Content-Type": "application/json" },
        body: "{",
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
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

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
      });
    });

    test("should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
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

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
      });
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
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

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
      });
    });

    test("should respond with NOT_FOUND when child occupation is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.addSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND)
      );

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.POST.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
      });
    });

    test("should respond with NOT_FOUND when parent skill is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.addSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND)
      );

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.POST.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
      });
    });

    test("should respond with BAD_REQUEST when ESCO occupation lacks relationType", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.addSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE)
      );

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.INVALID_RELATION_TYPE,
      });
    });

    test("should respond with BAD_REQUEST when ESCO occupation has signallingValueLabel", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.addSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_SIGNALLING_VALUE_LABEL)
      );

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.INVALID_SIGNALLING_VALUE_LABEL,
      });
    });

    test("should respond with BAD_REQUEST when relation code is inconsistent", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.addSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.RELATION_CODE_INCONSISTENT)
      );

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.RELATION_CODE_INCONSISTENT,
      });
    });

    test("should respond with BAD_REQUEST when Local occupation has both relationType and signallingValueLabel", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.addSkill.mockRejectedValue(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.MUTUALLY_EXCLUSIVE_VALUES)
      );

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.MUTUALLY_EXCLUSIVE_VALUES,
      });
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.addSkill.mockRejectedValue(
        new OccupationSkillValidationError(
          SkillForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION
        )
      );

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
      });
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save (generic error)", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.addSkill.mockRejectedValue(new Error("generic error"));

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
      });
    });

    test("should respond with BAD_REQUEST when body is not valid JSON and JSON.parse throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "{",
      } as unknown as APIGatewayProxyEvent;

      const parseSpy = jest.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string parse error";
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      parseSpy.mockRestore();
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save (generic non-Error)", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationToSkillRelation.addSkill.mockRejectedValue("string generic DB error");

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
      });
    });
  });
});

function RouterModelId(): string {
  return getMockStringId(1);
}

function RouterOccupationId(): string {
  return getMockStringId(2);
}
