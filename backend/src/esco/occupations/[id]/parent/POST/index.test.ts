import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "../../../_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as postOccupationParentHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupation } from "../../../_shared/occupation.types";
import { getIOccupationMockData } from "../../../_shared/testDataHelper";
import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { getIOccupationGroupMockData } from "esco/occupationGroup/_shared/testDataHelper";
import { IOccupationService, ModelForOccupationValidationErrorCode } from "../../../services/occupation.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import * as occupationHierarchyValidation from "esco/occupationHierarchy/occupationHierarchyValidation";
import { buildParentResponse } from "./response";
import OccupationAPISpecs from "api-specifications/esco/occupation";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformDynamicEntitySpy = jest.spyOn(transformModule, "transformDynamicEntity");

// Mock service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

// Mock repository registry
jest.mock("server/repositoryRegistry/repositoryRegistry");
const mockGetRepositoryRegistry = jest.mocked(getRepositoryRegistry);

// Spy on validation functions instead of mocking the whole module to prevent leaking/pollution
const isNewOccupationHierarchyPairSpecValidSpy = jest.spyOn(
  occupationHierarchyValidation,
  "isNewOccupationHierarchyPairSpecValid"
);
const isParentChildCodeConsistentSpy = jest.spyOn(occupationHierarchyValidation, "isParentChildCodeConsistent");

describe("Test for occupation Parent POST handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    isNewOccupationHierarchyPairSpecValidSpy.mockReturnValue(true);
    isParentChildCodeConsistentSpy.mockReturnValue(true);

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
      OccupationGroup: {
        Model: {
          findOne: jest.fn(),
        },
      },
      occupationHierarchy: {
        hierarchyModel: {
          findOneAndUpdate: jest.fn(),
        },
      },
    } as unknown as RepositoryRegistry;
    mockGetRepositoryRegistry.mockReturnValue(mockRepositoryRegistry);
  });

  afterAll(() => {
    isNewOccupationHierarchyPairSpecValidSpy.mockRestore();
    isParentChildCodeConsistentSpy.mockRestore();
  });

  describe("POST /models/{modelId}/occupations/{id}/parent", () => {
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

        const actualResponse = await postOccupationParentHandler(givenEvent);
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("should respond with CREATED status code and transformed parent for valid input (Occupation parent)", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenParentId = getMockStringId(3);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.ESCOOccupation,
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
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getIOccupationMockData(2) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockParent.id = givenParentId;
      mockParent._id = givenParentId;
      mockParent.occupationType = ObjectTypes.ESCOOccupation;
      mockParent.code = "1111";
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild), // first call for child
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent), // second call for parent
        });

      // Mock findOneAndUpdate
      const mockHierarchyModel = mockGetRepositoryRegistry().occupationHierarchy.hierarchyModel;
      (mockHierarchyModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      // Invoke handler
      const actualResponse = await postOccupationParentHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(transformModule.transformDynamicEntity).toHaveBeenCalledWith(mockParent, givenResourcesBaseUrl);
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformDynamicEntitySpy.mock.results[0].value);
    });

    test("should respond with CREATED status code and transformed parent for valid input (OccupationGroup parent)", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);
      const givenParentId = getMockStringId(3);
      const RouterResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(RouterResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.ISCOGroup,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      // Mock validateModelForOccupation success
      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      // Mock child findOne
      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterOccupationId;
      mockChild._id = RouterOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      // Parent is an OccupationGroup (ISCOGroup)
      const mockParent: IOccupationGroup & { _id?: string; toObject?: jest.Mock } = getIOccupationGroupMockData(1);
      mockParent.id = givenParentId;
      mockParent._id = givenParentId;
      mockParent.groupType = ObjectTypes.ISCOGroup;
      mockParent.code = "1111";
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const mockGroupModel = mockGetRepositoryRegistry().OccupationGroup.Model;
      (mockGroupModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockParent),
      });

      // Mock findOneAndUpdate
      const mockHierarchyModel = mockGetRepositoryRegistry().occupationHierarchy.hierarchyModel;
      (mockHierarchyModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      // Invoke handler
      const actualResponse = await postOccupationParentHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(transformModule.transformDynamicEntity).toHaveBeenCalledWith(mockParent, RouterResourcesBaseUrl);
    });

    test("should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "POST",
        path: "/models/invalid-id/occupations/invalid-id/parent",
        pathParameters: { modelId: "invalid-id", id: "invalid-id" },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: getMockStringId(3),
          parentType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is empty", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when Content-Type is invalid", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: RouterModelId, id: RouterOccupationId },
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({}),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationParentHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with BAD_REQUEST when schema validation fails", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: RouterModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: "invalid-id-too-short",
          parentType: "invalid-type",
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationParentHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with TOO_LARGE_PAYLOAD when body is too long", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(OccupationAPISpecs.POST.Constants.MAX_POST_PAYLOAD_LENGTH + 1),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON and JSON.parse throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);
      const jsonParseSpy = jest.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string error";
      });

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      jsonParseSpy.mockRestore();
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: RouterModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: getMockStringId(3),
          parentType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(
        ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID
      );

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterOccupationId;
      mockChild._id = RouterOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getIOccupationMockData(2) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockParent.id = getMockStringId(3);
      mockParent._id = getMockStringId(3);
      mockParent.occupationType = ObjectTypes.ESCOOccupation;
      mockParent.code = "1111";
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild), // first call for child
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent), // second call for parent
        });

      const actualResponse = await postOccupationParentHandler(RouterEvent);
      console.log("ACTUAL RESPONSE MODEL NOT FOUND TEST:", actualResponse);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: getMockStringId(3),
          parentType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(
        ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB
      );

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterOccupationId;
      mockChild._id = RouterOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getIOccupationMockData(2) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockParent.id = getMockStringId(3);
      mockParent._id = getMockStringId(3);
      mockParent.occupationType = ObjectTypes.ESCOOccupation;
      mockParent.code = "1111";
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild), // first call for child
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent), // second call for parent
        });

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: getMockStringId(3),
          parentType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(
        ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED
      );

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterOccupationId;
      mockChild._id = RouterOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getIOccupationMockData(2) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockParent.id = getMockStringId(3);
      mockParent._id = getMockStringId(3);
      mockParent.occupationType = ObjectTypes.ESCOOccupation;
      mockParent.code = "1111";
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild), // first call for child
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent), // second call for parent
        });

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with NOT_FOUND when child occupation is not found", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: getMockStringId(3),
          parentType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with NOT_FOUND when parent is not found", async () => {
      const RouterModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);
      const RouterParentId = getMockStringId(3);

      const RouterEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: RouterModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: RouterParentId,
          parentType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const RouterOccupationServiceMock = mockGetServiceRegistry().occupation;
      (RouterOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterOccupationId;
      mockChild._id = RouterOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild), // first call for child
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null), // second call for parent (not found)
        });

      const actualResponse = await postOccupationParentHandler(RouterEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("should respond with BAD_REQUEST when type validation fails", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);
      const givenParentId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterOccupationId;
      mockChild._id = RouterOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getIOccupationMockData(2) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockParent.id = givenParentId;
      mockParent._id = givenParentId;
      mockParent.occupationType = ObjectTypes.ESCOOccupation;
      mockParent.code = "1111";
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent),
        });

      isNewOccupationHierarchyPairSpecValidSpy.mockReturnValueOnce(false);

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when code consistency validation fails", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);
      const givenParentId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const RouterOccupationServiceMock = mockGetServiceRegistry().occupation;
      (RouterOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterOccupationId;
      mockChild._id = RouterOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getIOccupationMockData(2) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockParent.id = givenParentId;
      mockParent._id = givenParentId;
      mockParent.occupationType = ObjectTypes.ESCOOccupation;
      mockParent.code = "1111";
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent),
        });

      isNewOccupationHierarchyPairSpecValidSpy.mockReturnValueOnce(true);
      isParentChildCodeConsistentSpy.mockReturnValueOnce(false);

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with CREATED status code and transformed parent for valid input (LocalOccupation parent)", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenParentId = getMockStringId(3);
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.LocalOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = givenOccupationId;
      mockChild._id = givenOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getIOccupationMockData(2) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockParent.id = givenParentId;
      mockParent._id = givenParentId;
      mockParent.occupationType = ObjectTypes.LocalOccupation;
      mockParent.code = "1111";
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent),
        });

      const mockHierarchyModel = mockGetRepositoryRegistry().occupationHierarchy.hierarchyModel;
      (mockHierarchyModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const actualResponse = await postOccupationParentHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(transformModule.transformDynamicEntity).toHaveBeenCalledWith(mockParent, givenResourcesBaseUrl);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);
      const givenParentId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterOccupationId;
      mockChild._id = RouterOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getIOccupationMockData(2) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockParent.id = givenParentId;
      mockParent._id = givenParentId;
      mockParent.occupationType = ObjectTypes.ESCOOccupation;
      mockParent.code = "1111";
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent),
        });

      isNewOccupationHierarchyPairSpecValidSpy.mockReturnValueOnce(true);
      isParentChildCodeConsistentSpy.mockReturnValueOnce(true);

      const mockHierarchyModel = mockGetRepositoryRegistry().occupationHierarchy.hierarchyModel;
      (mockHierarchyModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue("string error"),
      });

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save (Error instance)", async () => {
      const givenModelId = getMockStringId(1);
      const RouterOccupationId = getMockStringId(2);
      const givenParentId = getMockStringId(3);

      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${RouterOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: RouterOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      checkRole.mockResolvedValue(true);

      const givenOccupationServiceMock = mockGetServiceRegistry().occupation;
      (givenOccupationServiceMock.validateModelForOccupation as jest.Mock).mockResolvedValue(null);

      const mockChild = getIOccupationMockData(1) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockChild.id = RouterOccupationId;
      mockChild._id = RouterOccupationId;
      mockChild.occupationType = ObjectTypes.ESCOOccupation;
      mockChild.code = "1111.1";
      mockChild.toObject = jest.fn().mockReturnValue(mockChild);

      const mockParent = getIOccupationMockData(2) as IOccupation & { _id?: string; toObject?: jest.Mock };
      mockParent.id = givenParentId;
      mockParent._id = givenParentId;
      mockParent.occupationType = ObjectTypes.ESCOOccupation;
      mockParent.code = "1111";
      mockParent.toObject = jest.fn().mockReturnValue(mockParent);

      const mockOccupationModel = mockGetRepositoryRegistry().occupation.Model;
      (mockOccupationModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockChild),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockParent),
        });

      isNewOccupationHierarchyPairSpecValidSpy.mockReturnValueOnce(true);
      isParentChildCodeConsistentSpy.mockReturnValueOnce(true);

      const mockHierarchyModel = mockGetRepositoryRegistry().occupationHierarchy.hierarchyModel;
      (mockHierarchyModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error("DB Connection Error")),
      });

      const actualResponse = await postOccupationParentHandler(givenEvent);
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
