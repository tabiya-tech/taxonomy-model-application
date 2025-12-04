import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "./transform";
import { handler as occupationGroupHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import { randomUUID } from "node:crypto";
import ErrorAPISpecs from "api-specifications/error";
import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import * as authenticatorModule from "auth/authenticator";
import { usersRequestContext } from "_test_utilities/dataModel";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupationGroup, ModalForOccupationGroupValidationErrorCode } from "./OccupationGroup.types";
import { getIOccupationGroupMockData } from "./testDataHelper";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import {
  testMethodsNotAllowed,
  testRequestJSONMalformed,
  testRequestJSONSchema,
  testTooLargePayload,
  testUnsupportedMediaType,
} from "_test_utilities/stdRESTHandlerTests";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { IOccupationGroupService, OccupationGroupModelValidationError } from "./occupationGroupService.type";
import { IModelRepository } from "modelInfo/modelInfoRepository";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockReturnValue(true);

const transformSpy = jest.spyOn(transformModule, "transform");
const transformPaginatedSpy = jest.spyOn(transformModule, "transformPaginated");

// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupationGroup handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize the service registry mock
    const mockServiceRegistry = {
      occupationGroup: {
        create: jest.fn(),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupationGroup: jest.fn(),
      } as IOccupationGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("POST", () => {
    describe("Security tests", () => {
      test("should response with FORBIDDEN status code if a user is not a model manager", async () => {
        // GIVEN The user is a registered user (not a model manager)
        const givenRequestContext = usersRequestContext.REGISTED_USER;

        // AND checkRole return false
        checkRole.mockReturnValue(false);

        // AND the even with the given request context
        const givenEvent: APIGatewayProxyEvent = {
          httpMethod: HTTP_VERBS.POST,
          body: JSON.stringify({}),
          headers: {
            "Content-Type": "application/json",
          },
          requestContext: givenRequestContext,
        } as never;

        // WHEN the handler is invoked with the given event
        const actualResponse = await occupationGroupHandler(givenEvent);

        // THEN expect the handler to respond with the FORBIDDEN status
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("POST should response with the CREATED status code and the newly created occupationGroup for a valid and max size payload", async () => {
      // GIVEN a valid request (method & header & payload)
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: "foo",
        UUIDHistory: ["foo"],
        released: false,
      };

      const givenPayload: OccupationGroupAPISpecs.Types.POST.Request.Payload = {
        modelId: givenModel.id.toString(),
        code: getMockRandomISCOGroupCode(),
        groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
        preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        description: getRandomString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        altLabels: [
          getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
          getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
        ],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: { modelId: givenModel.id.toString() },
        path: `/models/${givenModel.id}/occupationGroups`,
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND the repository that will successfully create the occupationGroup
      const givenOccupationGroup: IOccupationGroup = getIOccupationGroupMockData();

      const givenModelInfoRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue(givenModel),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue([]),
        getHistory: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockClear().mockReturnValue(givenModelInfoRepositoryMock);

      const givenOccupationGroupServiceMock = {
        create: jest.fn().mockResolvedValue(givenOccupationGroup),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest.fn().mockResolvedValue(null),
      } as IOccupationGroupService;

      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // THEN expect the handler to call the model repository to access the model
      expect(getServiceRegistry().occupationGroup.create).toHaveBeenCalledWith({ ...givenPayload });

      // AND respond with the CREATED status code
      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the transformation function is called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(
        {
          ...givenOccupationGroup,
        },
        givenResourcesBaseUrl
      );
      // AND the handler to return the expected result
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
    });
    test("POST should respond with the INTERNAL_SERVER_ERROR status code if the repository failed to create the occupationGroup", async () => {
      // GIVEN a valid request {method & header & payload}
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: "foo",
        UUIDHistory: ["foo"],
        released: false,
      };

      const givenPayload = {
        modelId: givenModel.id.toString(),
        code: getMockRandomISCOGroupCode(),
        groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
        preferredLabel: "some random label",
        description: "some random description",
        altLabels: ["some random alt label 1", "some random alt label 2"],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: { modelId: givenModel.id.toString() },
        path: `/models/${givenModel.id}/occupationGroups`,
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      const givenOccupationGroupServiceMock = {
        create: jest.fn().mockRejectedValue(new Error("foo")),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest.fn().mockResolvedValue({ isValid: true }),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      const givenModelInfoRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue(givenModel),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue([]),
        getHistory: jest.fn().mockResolvedValue([]),
      } as IModelRepository;

      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockClear().mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // AND expect the handler to call the repository with the given payload
      expect(getServiceRegistry().occupationGroup.create).toHaveBeenCalledWith({ ...givenPayload });
      // AND to respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode:
          OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        message: "Failed to create the occupation group in the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("POST should respond with the NOT_FOUND status code if the repository failed to find the given model from modelId payload", async () => {
      // GIVEN a valid request {method & header & payload}
      const givenModelId = getMockStringId(1);

      const givenPayload = {
        modelId: givenModelId.toString(),
        code: getMockRandomISCOGroupCode(),
        groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
        preferredLabel: "some random label",
        description: "some random description",
        altLabels: ["some random alt label 1", "some random alt label 2"],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: { modelId: givenModelId.toString() },
        path: `/models/${givenModelId}/occupationGroups`,
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      const givenOccupationGroupServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(
            new OccupationGroupModelValidationError(ModalForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
          ),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest.fn().mockResolvedValue({ isValid: true }),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      const givenModelInfoRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue(null),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue([]),
        getHistory: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockClear().mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // AND to respond with the NOT_FOUND status
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: OccupationGroupAPISpecs.Enums.POST.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
        message: "Model not found by the provided ID",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("POST should respond with the BAD_REQUEST status code if the model of the modelId provided is released", async () => {
      // GIVEN a valid request {method & header & payload}
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: "foo",
        UUIDHistory: ["foo"],
        released: true,
      };
      const givenPayload = {
        modelId: givenModel.id.toString(),
        code: getMockRandomISCOGroupCode(),
        groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
        preferredLabel: "some random label",
        description: "some random description",
        altLabels: ["some random alt label 1", "some random alt label 2"],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: { modelId: givenModel.id.toString() },
        path: `/models/${givenModel.id}/occupationGroups`,
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      const givenModelInfoRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue(givenModel),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue([]),
        getHistory: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockClear().mockReturnValue(givenModelInfoRepositoryMock);

      const givenOccupationGroupServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(
            new OccupationGroupModelValidationError(ModalForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED)
          ),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest.fn().mockResolvedValue({ isValid: true }),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // THEN expect the handler to call the repository with the given payload
      expect(getServiceRegistry().occupationGroup.create).toHaveBeenCalledWith({ ...givenPayload });
      // AND to respond with the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: OccupationGroupAPISpecs.Enums.POST.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
        message: "Model is released and cannot be modified",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("POST should respond with the BAD_REQUEST status code if modelId in payload does not match modelId in path", async () => {
      // GIVEN a valid request with mismatched modelIds
      const givenModelIdInPath = getMockStringId(1);
      const givenModelIdInPayload = getMockStringId(2);
      const givenPayload = {
        modelId: givenModelIdInPayload.toString(),
        code: getMockRandomISCOGroupCode(),
        groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
        preferredLabel: "some random label",
        description: "some random description",
        altLabels: ["some random alt label 1", "some random alt label 2"],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: { modelId: givenModelIdInPath.toString() },
        path: `/models/${givenModelIdInPath}/occupationGroups`,
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // THEN expect the handler to respond with the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode:
          OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        message: "modelId in payload does not match modelId in path",
        details: `Payload modelId: ${givenModelIdInPayload}, Path modelId: ${givenModelIdInPath}`,
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("POST should respond with the BAD_REQUEST status code if modelId is missing in the path", async () => {
      // GIVEN a valid request with missing modelId in path
      const givenModelIdInPayload = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelIdInPayload.toString(),
        code: getMockRandomISCOGroupCode(),
        groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
        preferredLabel: "some random label",
        description: "some random description",
        altLabels: ["some random alt label 1", "some random alt label 2"],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: {},
        path: "/invalid/path/without/modelId",
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // THEN expect the handler to respond with the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode:
          OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        message: "modelId is missing in the path",
        details: expect.stringContaining('"path":"/invalid/path/without/modelId"'),
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    testUnsupportedMediaType(occupationGroupHandler);
    testRequestJSONSchema(occupationGroupHandler);
    testRequestJSONMalformed(occupationGroupHandler);
    testTooLargePayload(
      HTTP_VERBS.POST,
      OccupationGroupAPISpecs.Constants.MAX_POST_PAYLOAD_LENGTH,
      occupationGroupHandler
    );
    test("POST should return FORBIDDEN status code if the user does not have the required role", async () => {
      // GIVEN a valid request (method & header & payload)
      const givenModelId = getMockStringId(1);

      const givenPayload = {
        modelId: givenModelId,
        code: getMockRandomISCOGroupCode(),
        groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
        preferredLabel: "some random label",
        description: "some random description",
        altLabels: ["some random alt label 1", "some random alt label 2"],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
      } as never;

      // AND the user does not have the required role
      checkRole.mockReturnValue(false);

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // THEN expect the handler to return the FORBIDDEN status
      expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });
    test("POST should return BAD_REQUEST when body is null", async () => {
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: null,
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: { modelId: givenModelId.toString() },
        path: `/models/${givenModelId}/occupationGroups`,
      } as never;
      checkRole.mockReturnValue(true);
      const actualResponse = await occupationGroupHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("POST should respond with INTERNAL_SERVER_ERROR when failed to fetch model detail from DB", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId.toString(),
        code: getMockRandomISCOGroupCode(),
        groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
        preferredLabel: "some random label",
        description: "some random description",
        altLabels: ["some random alt label 1", "some random alt label 2"],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: { modelId: givenModelId.toString() },
        path: `/models/${givenModelId}/occupationGroups`,
      } as never;
      checkRole.mockReturnValue(true);
      const givenOccupationGroupServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(
            new OccupationGroupModelValidationError(ModalForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB)
          ),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest.fn().mockResolvedValue({ isValid: true }),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      const actualResponse = await occupationGroupHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode:
          OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        message: "Failed to fetch the model detail from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("POST should respond with INTERNAL_SERVER_ERROR for uniknown vlaidation error code", async () => {
      const givenModelId = getMockStringId(1);
      const givenPayload = {
        modelId: givenModelId.toString(),
        code: getMockRandomISCOGroupCode(),
        groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
        preferredLabel: "some random label",
        description: "some random description",
        altLabels: ["some random alt label 1", "some random alt label 2"],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
      };

      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: { modelId: givenModelId.toString() },
        path: `/models/${givenModelId}/occupationGroups`,
      } as never;
      const givenOccupationGroupServiceMock = {
        create: jest
          .fn()
          .mockRejectedValue(new OccupationGroupModelValidationError(3 as ModalForOccupationGroupValidationErrorCode)),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest.fn().mockResolvedValue({ isValid: true }),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;
      const actualResponse = await occupationGroupHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode:
          OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        message: "Failed to create the occupation group in the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
  });

  describe("GET", () => {
    // GIVEN a valid GET request (method & header)
    const givenModelId = getMockStringId(1);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      pathParameters: { modelId: givenModelId.toString() },
    };

    // AND a configured base path for resource
    const givenResourcesBaseUrl = "https://some/path/to/api/resources";
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);

    test("GET should return only the occupationGroups for the given modelId", async () => {
      // AND GIVEN a repository that will successfully get an arbitrary number (N) of models
      const givenOccupationGroups: Array<IOccupationGroup> = [
        {
          ...getIOccupationGroupMockData(1, givenModelId),
          UUID: "foo",
          UUIDHistory: ["foo"],
          importId: randomUUID(),
        },
        {
          ...getIOccupationGroupMockData(2, givenModelId),
          UUID: "bar",
          UUIDHistory: ["bar"],
          importId: randomUUID(),
        },
        {
          ...getIOccupationGroupMockData(3, givenModelId),
          UUID: "baz",
          UUIDHistory: ["baz"],
          importId: randomUUID(),
        },
      ];

      const firstPageOccupationGroups = givenOccupationGroups.slice(-2);

      const limit = 2;
      const firstPageCursor = Buffer.from(
        JSON.stringify({ id: givenOccupationGroups[2].id, createdAt: givenOccupationGroups[2].createdAt })
      ).toString("base64");

      const expectedNextCursor = null;

      // AND the user is not model manager
      checkRole.mockReturnValueOnce(true);

      const givenOccupationGroupServiceMock = {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: firstPageOccupationGroups, nextCursor: null }),
        validateModelForOccupationGroup: jest.fn().mockResolvedValue(null),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      // WHEN the occupationGroup handler is invoked with the given event and the modelId as path parameter
      const actualResponse = await occupationGroupHandler({
        ...givenEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      } as never);

      const expectedFirstPageOccupationGroups = {
        data: firstPageOccupationGroups,
        limit: limit,
        nextCursor: expectedNextCursor,
      };

      // THEN expect the handler to return the OK status
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });

      // AND the response body contains only the first page OccupationGroups
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        ...expectedFirstPageOccupationGroups,
        data: expect.arrayContaining(
          expectedFirstPageOccupationGroups.data.map((og) =>
            expect.objectContaining({
              UUID: og.UUID,
              UUIDHistory: og.UUIDHistory,
              code: og.code,
              originUri: og.originUri,
              preferredLabel: og.preferredLabel,
              altLabels: og.altLabels,
              groupType: og.groupType,
              description: og.description,
              id: og.id,
              modelId: og.modelId,
              createdAt: og.createdAt.toISOString(),
              updatedAt: og.updatedAt.toISOString(),
              path: `${givenResourcesBaseUrl}/models/${og.modelId}/occupationGroups/${og.id}`,
              tabiyaPath: `${givenResourcesBaseUrl}/models/${og.modelId}/occupationGroups/${og.UUID}`,
            })
          )
        ),
      });
      // AND the transformation function is called correctly
      expect(transformPaginatedSpy).toHaveBeenCalledWith(
        firstPageOccupationGroups,
        givenResourcesBaseUrl,
        limit,
        expectedNextCursor
      );
    });

    test("GET should return nextCursor when nextCursor is present in the paginated occupation group result", async () => {
      // GIVEN role check passes for anonymous access
      checkRole.mockReturnValueOnce(true);

      const limit = 1;
      const givenOccupationGroups: Array<IOccupationGroup> = [
        {
          ...getIOccupationGroupMockData(1, givenModelId),
          UUID: "foo",
          UUIDHistory: ["foo"],
          importId: randomUUID(),
        },
        {
          ...getIOccupationGroupMockData(2, givenModelId),
          UUID: "bar",
          UUIDHistory: ["bar"],
          importId: randomUUID(),
        },
      ];

      // AND a service that will successfully get the occupation groups (returns 2 items for limit 1)
      const givenOccupationGroupServiceMock = {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({
          items: [givenOccupationGroups[0]],
          nextCursor: { _id: givenOccupationGroups[1].id, createdAt: givenOccupationGroups[0].createdAt },
        }),
        validateModelForOccupationGroup: jest.fn().mockResolvedValue(null),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      // WHEN the occupationGroup handler is invoked with the given event and limit 1
      const actualResponse = await occupationGroupHandler({
        ...givenEvent,
        queryStringParameters: { limit: limit.toString() },
      } as never);

      // THEN expect the handler to return the OK status
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });

      // verify the service was called correctly
      expect(getServiceRegistry().occupationGroup.findPaginated).toHaveBeenCalledWith(givenModelId, undefined, limit);
      // AND the response body contains a nextCursor (base64 encoded)
      const responseBody = JSON.parse(actualResponse.body);
      expect(responseBody.nextCursor).toBeDefined();
      expect(typeof responseBody.nextCursor).toBe("string");

      // Verify it's a valid base64 string by decoding it
      const decodedCursor = Buffer.from(responseBody.nextCursor, "base64").toString("utf-8");
      expect(JSON.parse(decodedCursor)).toHaveProperty("id");
      expect(JSON.parse(decodedCursor)).toHaveProperty("createdAt");

      // AND the transformation function is called correctly
      expect(transformPaginatedSpy).toHaveBeenCalledWith(
        [givenOccupationGroups[0]],
        givenResourcesBaseUrl,
        limit,
        responseBody.nextCursor
      );
    });

    test("GET should respond with the BAD_REQUEST status code if the modelId is not passed as a path parameter", async () => {
      // AND GIVEN the repository fails to get the occupationGroups
      const firstPageCursorObject = {
        id: getMockStringId(1),
        createdAt: new Date(),
      };
      const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

      const limit = 2;

      const givenBadEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        queryStringParameters: {},
      };
      // AND the user is not model manager
      checkRole.mockReturnValueOnce(true);

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler({
        ...givenBadEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      } as never);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const parsedMissing = JSON.parse(actualResponse.body);
      expect(parsedMissing).toMatchObject({
        errorCode:
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        message: "modelId is missing in the path",
      });
      expect(typeof parsedMissing.details).toBe("string");
    });
    test("GET should respond with the BAD_REQUEST status code if the modelId is not correct model id", async () => {
      // AND GIVEN the repository fails to get the occupationGroups
      const firstPageCursorObject = {
        id: getMockStringId(1),
        createdAt: new Date(),
      };
      const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

      const limit = 2;

      const givenBadEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: "foo" },
        queryStringParameters: {},
      };

      // AND the user is not model manager
      checkRole.mockReturnValueOnce(true);

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler({
        ...givenBadEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      } as never);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const parsedInvalidModel = JSON.parse(actualResponse.body);
      expect(parsedInvalidModel).toMatchObject({
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      });
      expect(typeof parsedInvalidModel.details).toBe("string");
    });
    test("GET should respond with the BAD_REQUEST status code if the query parameter is not valid query parameter", async () => {
      // GIVEN the repository fails to get the occupationGroups
      const firstPageCursorObject = {
        id: getMockStringId(1),
        createdAt: new Date(),
      };
      const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

      // AND the user is not model manager
      checkRole.mockReturnValueOnce(true);

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler({
        ...givenEvent,
        queryStringParameters: { limit: "foo", cursor: firstPageCursor },
      } as never);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const parsedInvalidQuery = JSON.parse(actualResponse.body);
      expect(parsedInvalidQuery).toMatchObject({
        errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      });
      expect(typeof parsedInvalidQuery.details).toBe("string");
    });

    test("GET should respond with the NOT_FOUND if the model does not exist", async () => {
      // GIVEN a service that model does not exists
      const givenOccupationGroupServiceMock = {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn(),
        validateModelForOccupationGroup: jest
          .fn()
          .mockResolvedValue(ModalForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;
      checkRole.mockReturnValueOnce(true);
      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent as never);

      // THEN expect the handler to return the NOT_FOUND status
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);

      // AND the response body contains the error information
      const expectedErrorBody = {
        errorCode: OccupationGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
        message: "Model not found",
        details: `No model found with id: ${givenModelId}`,
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET should respond with the INTERNAL_SERVER_ERROR if the model validation failed to fetch data from database", async () => {
      // GIVEN a service that model does not exists
      const givenOccupationGroupServiceMock = {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn(),
        validateModelForOccupationGroup: jest
          .fn()
          .mockResolvedValue(ModalForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;
      checkRole.mockReturnValueOnce(true);
      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent as never);

      // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);

      // AND the response body contains the error information
      const expectedErrorBody = {
        errorCode:
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        message: "Failed to fetch the model details from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET should respond with the BAD_REQUEST if the cursor decoding failed", async () => {
      // GIVEN a service that model does not exists
      const givenOccupationGroupServiceMock = {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn(),
        validateModelForOccupationGroup: jest.fn(),
        decodeCursor: jest.fn().mockImplementation(() => {
          throw new Error("Failed to decode cursor");
        }),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;
      checkRole.mockReturnValueOnce(true);
      const cursor = Buffer.from(getRandomString(10)).toString("base64");
      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler({
        ...givenEvent,
        queryStringParameters: { cursor },
      } as never);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);

      // AND the response body contains the error information
      const expectedErrorBody = {
        errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
        message: "Invalid cursor parameter",

        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("GET should respond with the INTERNAL_SERVER_ERROR status code if the repository fails to get the occupationGroups", async () => {
      // AND GIVEN the repository fails to get the occupationGroups
      const firstPageCursorObject = {
        id: getMockStringId(1),
        createdAt: new Date(),
      };
      const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

      const givenOccupationGroupRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockRejectedValue(new Error("foo")),
        getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get").mockReturnValue(givenOccupationGroupRepositoryMock);
      const limit = 2;

      // AND the user is not model manager
      checkRole.mockReturnValueOnce(true);

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler({
        ...givenEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      } as never);

      // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode:
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        message: "Failed to retrieve the occupation groups from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    testMethodsNotAllowed(
      [HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH],
      occupationGroupHandler
    );
  });

  describe("GET individual occupation group", () => {
    test("GET /models/{modelId}/occupationGroups/{id} should return the occupation group for a valid ID", async () => {
      // GIVEN a valid request with modelId and occupationGroup ID
      const givenModelId = getMockStringId(1);
      const givenOccupationGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenOccupationGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/occupationGroups/${givenOccupationGroupId}`,
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND a repository that will successfully get the occupation group
      const givenOccupationGroup: IOccupationGroup = {
        ...getIOccupationGroupMockData(1, givenModelId),
        id: givenOccupationGroupId,
        UUID: "test-uuid",
        UUIDHistory: ["test-uuid"],
        importId: randomUUID(),
      };

      const givenOccupationGroupServiceMock = {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(givenOccupationGroup),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest.fn(),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // THEN respond with the OK status code
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the transformation function is called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(givenOccupationGroup, givenResourcesBaseUrl);
      // AND the handler to return the expected result
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
    });

    test("GET /models/{modelId}/occupationGroups/{id} should respond with NOT_FOUND if model does not exist", async () => {
      // GIVEN a valid request with modelId and occupationGroup ID
      const givenModelId = getMockStringId(1);
      const givenOccupationGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenOccupationGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/occupationGroups/${givenOccupationGroupId}`,
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      const givenOccupationGroupServiceMock = {
        create: jest.fn(),
        findById: jest.fn(),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest
          .fn()
          .mockResolvedValue(ModalForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // AND respond with the NOT_FOUND status
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: OccupationGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
        message: "Model not found",
        details: `No model found with id: ${givenModelId}`,
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET /models/{modelId}/occupationGroups/{id} should respond with INTERNAL_SERVER_ERROR if model validator function failed to fetch from db", async () => {
      // GIVEN a valid request with modelId and occupationGroup ID
      const givenModelId = getMockStringId(1);
      const givenOccupationGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenOccupationGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/occupationGroups/${givenOccupationGroupId}`,
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      const givenOccupationGroupServiceMock = {
        create: jest.fn(),
        findById: jest.fn(),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest
          .fn()
          .mockResolvedValue(ModalForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // AND respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode:
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        message: "Failed to fetch the model details from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("GET /models/{modelId}/occupationGroups/{id} should response with BAD_REQUEST if the path validation failed ", async () => {
      const givenModelId = getTestString(100);
      const givenOccupationGroupId = getTestString(100);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: "foo", id: givenOccupationGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/occupationGroups/${givenOccupationGroupId}`,
      } as never;
      // AND User has the required role
      checkRole.mockReturnValue(true);
      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // AND respond with the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
        details: expect.stringContaining("modelId"),
      };

      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      });
      expect(typeof JSON.parse(actualResponse.body).details).toBe("string");
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("GET /models/{modelId}/occupationGroups/{id} should respond with NOT_FOUND if occupation group is not found", async () => {
      // GIVEN a valid request with modelId and occupationGroup ID
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: "foo",
        UUIDHistory: ["foo"],
        released: false,
      };
      const givenOccupationGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModel.id.toString(), id: givenOccupationGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModel.id}/occupationGroups/${givenOccupationGroupId}`,
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      const givenOccupationGroupServiceMock = {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest.fn(),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);
      // THEN respond with the NOT_FOUND status
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: OccupationGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_GROUP_NOT_FOUND,
        message: "Occupation group not found",
        details: `No occupation group found with id: ${givenOccupationGroupId}`,
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("GET /models/{modelId}/occupationGroups/{id} should respond with BAD_REQUEST if modelId is missing", async () => {
      const givenOccupationGroupId = getMockStringId(2);

      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { id: givenOccupationGroupId.toString() },
        queryStringParameters: {},
        path: `/models//occupationGroups/${givenOccupationGroupId}`,
      } as never;

      // AND role check passes for anonymous access
      checkRole.mockReturnValueOnce(true);

      // WHEN the occupation group handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent as never);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const parsedMissing = JSON.parse(actualResponse.body);
      expect(parsedMissing).toMatchObject({
        errorCode:
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        message: "modelId is missing in the path",
      });
      expect(typeof parsedMissing.details).toBe("string");
    });

    test("GET /models/{modelId}/occupationGroups/{id} should respond with INTERNAL_SERVER_ERROR if repository throws an error", async () => {
      // GIVEN a valid request with modelId and occupationGroup ID
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: "foo",
        UUIDHistory: ["foo"],
        released: false,
      };
      const givenOccupationGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModel.id.toString(), id: givenOccupationGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModel.id}/occupationGroups/${givenOccupationGroupId}`,
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      // AND a repository that will throw an error
      const givenOccupationGroupRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockRejectedValue(new Error("Database connection failed")),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get").mockReturnValue(givenOccupationGroupRepositoryMock);

      const givenOccupationGroupServiceMock = {
        create: jest.fn(),
        findById: jest.fn().mockRejectedValue(new Error("foo")),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForOccupationGroup: jest.fn(),
      } as IOccupationGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // THEN respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode:
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        message: "Failed to retrieve the occupation group from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
  });
});
