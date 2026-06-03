import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "esco/skill/_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as postOccupationSkillsHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupation } from "../../../_shared/occupation.types";
import { getIOccupationMockData } from "../../../_shared/testDataHelper";
import { ISkill } from "esco/skill/_shared/skill.types";
import { getISkillMockData } from "esco/skill/_shared/testDataHelper";
import { IOccupationService, ModelForOccupationValidationErrorCode } from "../../../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { SignallingValueLabel } from "esco/common/objectTypes";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformSkillSpy = jest.spyOn(transformModule, "transform");

// Mock service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

// Mock repository registry
jest.mock("server/repositoryRegistry/repositoryRegistry");
const mockGetRepositoryRegistry = jest.mocked(getRepositoryRegistry);

describe("Test for occupation Skills POST handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockServiceRegistry = {
      occupation: {
        validateModelForOccupation: jest.fn(),
      } as unknown as IOccupationService,
      initialize: jest.fn(),
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);

    const mockRepositoryRegistry = {
      occupation: {
        Model: {
          findOne: jest.fn(),
        },
      },
      skill: {
        Model: {
          findOne: jest.fn(),
        },
      },
      occupationToSkillRelation: {
        relationModel: {
          findOneAndUpdate: jest.fn(),
        },
      },
    } as unknown as RepositoryRegistry;
    mockGetRepositoryRegistry.mockReturnValue(mockRepositoryRegistry);
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

      // Mock validateModelForOccupation success
      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      // Mock child findOne
      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenOccupationId;
      mockChild._id = givenOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockSkill = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockSkill.id = givenSkillId;
      mockSkill._id = givenSkillId;
      mockSkill.toObject = jest.fn().mockReturnValue(mockSkill);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      // Mock findOneAndUpdate
      const mockRelationModel = mockGetRepositoryRegistry().occupationToSkillRelation.relationModel;
      (mockRelationModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      // Invoke handler
      const actualResponse = await postOccupationSkillsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(transformModule.transform).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockSkill.id,
        }),
        givenResourcesBaseUrl
      );
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        ...transformSkillSpy.mock.results[0].value,
        relationType: "essential",
        signallingValueLabel: null,
      });
    });

    test("should respond with CREATED status code and transformed skill for valid Local Occupation input with relationType", async () => {
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
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.OPTIONAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenOccupationId;
      mockChild._id = givenOccupationId;
      mockChild.occupationType = ObjectTypes.LocalOccupation;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockSkill = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockSkill.id = givenSkillId;
      mockSkill._id = givenSkillId;
      mockSkill.toObject = jest.fn().mockReturnValue(mockSkill);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const mockRelationModel = mockGetRepositoryRegistry().occupationToSkillRelation.relationModel;
      (mockRelationModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        ...transformSkillSpy.mock.results[0].value,
        relationType: "optional",
        signallingValueLabel: null,
      });
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
          signallingValue: 0.85,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenOccupationId;
      mockChild._id = givenOccupationId;
      mockChild.occupationType = ObjectTypes.LocalOccupation;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockSkill = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockSkill.id = givenSkillId;
      mockSkill._id = givenSkillId;
      mockSkill.toObject = jest.fn().mockReturnValue(mockSkill);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const mockRelationModel = mockGetRepositoryRegistry().occupationToSkillRelation.relationModel;
      (mockRelationModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        ...transformSkillSpy.mock.results[0].value,
        relationType: null,
        signallingValueLabel: "high",
        signallingValue: 0.85,
      });
    });

    test("should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "POST",
        path: "/models/invalid-id/occupations/invalid-id/skills",
        pathParameters: { modelId: "invalid-id", id: "invalid-id" },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is empty", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when Content-Type is invalid", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: RouterModelId, id: RouterOccupationId },
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({}),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationSkillsHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with BAD_REQUEST when schema validation fails", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: RouterModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: "too-short",
          relationType: "invalid-type",
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationSkillsHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with TOO_LARGE_PAYLOAD when body is too long", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(OccupationAPISpecs.POST.Constants.MAX_POST_PAYLOAD_LENGTH + 1),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON and JSON.parse throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const jsonParseSpy = jest.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string error";
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      jsonParseSpy.mockRestore();
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: RouterModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(
        ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID
      );

      const actualResponse = await postOccupationSkillsHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(
        ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB
      );

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(
        ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED
      );

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with NOT_FOUND when child occupation is not found", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: getMockStringId(3),
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with NOT_FOUND when parent skill is not found", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);
      const RouterSkillId = getMockStringId(3);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/occupations/${RouterOccupationId}/skills`,
        pathParameters: { modelId: RouterModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: RouterSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const RouterOccupationServiceMock = mockGetServiceRegistry().occupation;
      (RouterOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterOccupationId;
      mockChild._id = RouterOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null), // skill not found
      });

      const actualResponse = await postOccupationSkillsHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with BAD_REQUEST when ESCO occupation lacks relationType", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenSkillId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenOccupationId;
      mockChild._id = givenOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockSkill = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockSkill.id = givenSkillId;
      mockSkill._id = givenSkillId;
      mockSkill.toObject = jest.fn().mockReturnValue(mockSkill);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when ESCO occupation has signallingValueLabel", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenSkillId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.HIGH,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenOccupationId;
      mockChild._id = givenOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockSkill = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockSkill.id = givenSkillId;
      mockSkill._id = givenSkillId;
      mockSkill.toObject = jest.fn().mockReturnValue(mockSkill);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when Local occupation has both relationType and signallingValueLabel", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenSkillId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.HIGH,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenOccupationId;
      mockChild._id = givenOccupationId;
      mockChild.occupationType = ObjectTypes.LocalOccupation;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockSkill = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockSkill.id = givenSkillId;
      mockSkill._id = givenSkillId;
      mockSkill.toObject = jest.fn().mockReturnValue(mockSkill);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when Local occupation has neither relationType nor signallingValueLabel", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenSkillId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: givenSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenOccupationId;
      mockChild._id = givenOccupationId;
      mockChild.occupationType = ObjectTypes.LocalOccupation;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockSkill = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockSkill.id = givenSkillId;
      mockSkill._id = givenSkillId;
      mockSkill.toObject = jest.fn().mockReturnValue(mockSkill);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const RouterSkillId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: RouterSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenOccupationId;
      mockChild._id = givenOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockSkill = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockSkill.id = RouterSkillId;
      mockSkill._id = RouterSkillId;
      mockSkill.toObject = jest.fn().mockReturnValue(mockSkill);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const mockRelationModel = mockGetRepositoryRegistry().occupationToSkillRelation.relationModel;
      (mockRelationModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue("string error"),
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save (Error instance)", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const RouterSkillId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/skills`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkillId: RouterSkillId,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenOccupationId;
      mockChild._id = givenOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockSkill = getISkillMockData(2) as ISkill & { _id?: string; toObject?: jest.Mock };
      mockSkill.id = RouterSkillId;
      mockSkill._id = RouterSkillId;
      mockSkill.toObject = jest.fn().mockReturnValue(mockSkill);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockSkillModel = mockGetRepositoryRegistry().skill.Model;
      (mockSkillModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const mockRelationModel = mockGetRepositoryRegistry().occupationToSkillRelation.relationModel;
      (mockRelationModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error("DB Connection Error")),
      });

      const actualResponse = await postOccupationSkillsHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});
