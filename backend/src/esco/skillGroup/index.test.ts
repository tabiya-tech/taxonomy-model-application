import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "./transform";
import { handler as skillGroupHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import { randomUUID } from "node:crypto";
import ErrorAPISpecs from "api-specifications/error";
import { getRandomString } from "_test_utilities/getMockRandomData";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";

import * as authenticatorModule from "auth/authorizer";
import { ISkillGroup, ISkillGroupChild, ModelForSkillGroupValidationErrorCode } from "./skillGroup.types";
import { getISkillGroupMockData, getISkillGroupSkillTypedChildData } from "./testDataHelper";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { testMethodsNotAllowed } from "_test_utilities/stdRESTHandlerTests";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillGroupService } from "./skillGroupService.type";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformSpy = jest.spyOn(transformModule, "transform");
const transformPaginatedSpy = jest.spyOn(transformModule, "transformPaginated");
const transformParentsSpy = jest.spyOn(transformModule, "transformPaginatedParents");
const transformChildrenSpy = jest.spyOn(transformModule, "transformPaginatedChildren");
// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
describe("Test for skillGroup handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize the service registry mock
    const mockServiceRegistry = {
      skillGroup: {
        findById: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForSkillGroup: jest.fn(),
        findParents: jest.fn(),
        findChildren: jest.fn(),
      } as ISkillGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
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

    test("GET should return only the skillGroups for the given modelId", async () => {
      // AND GIVEN a repository that will successfully get an arbitrary number (N) of models
      const givenSkillGroups: Array<ISkillGroup> = [
        {
          ...getISkillGroupMockData(1, givenModelId),
          UUID: "foo",
          UUIDHistory: ["foo"],
          importId: randomUUID(),
        },
        {
          ...getISkillGroupMockData(2, givenModelId),
          UUID: "bar",
          UUIDHistory: ["bar"],
          importId: randomUUID(),
        },
        {
          ...getISkillGroupMockData(3, givenModelId),
          UUID: "baz",
          UUIDHistory: ["baz"],
          importId: randomUUID(),
        },
      ];
      const firstPageSkillGroups = givenSkillGroups.slice(-2);

      const limit = 2;
      const firstPageCursor = Buffer.from(
        JSON.stringify({ id: givenSkillGroups[2].id, createdAt: givenSkillGroups[2].createdAt })
      ).toString("base64");

      const expectedNextCursor = null;

      // AND the user is not model manager
      checkRole.mockResolvedValueOnce(true);

      const givenSkillGroupServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
        findPaginated: jest.fn().mockResolvedValue({ items: firstPageSkillGroups, nextCursor: null }),
        validateModelForSkillGroup: jest.fn().mockResolvedValue(null),
      } as ISkillGroupService;

      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the SkillGroup handler is invoked with the given event and the modelId as path parameter
      const actualResponse = await skillGroupHandler({
        ...givenEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
        path: `/models/${givenModelId}/skillGroups`,
      } as never);

      const expectedFirstPageSkillGroups = {
        data: firstPageSkillGroups,
        limit: limit,
        nextCursor: expectedNextCursor,
      };
      // THEN expect the handler to return the OK status
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the response body contains only the first page SkillGroups
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        ...expectedFirstPageSkillGroups,
        data: expect.arrayContaining(
          expectedFirstPageSkillGroups.data.map((og) =>
            expect.objectContaining({
              UUID: og.UUID,
              UUIDHistory: og.UUIDHistory,
              code: og.code,
              originUri: og.originUri,
              preferredLabel: og.preferredLabel,
              altLabels: og.altLabels,
              description: og.description,
              id: og.id,
              modelId: og.modelId,
              scopeNote: og.scopeNote,
              createdAt: og.createdAt.toISOString(),
              updatedAt: og.updatedAt.toISOString(),
              path: `${givenResourcesBaseUrl}/models/${og.modelId}/skillGroups/${og.id}`,
              tabiyaPath: `${givenResourcesBaseUrl}/models/${og.modelId}/skillGroups/${og.UUID}`,
            })
          )
        ),
      });
      // AND the transformation function is called correctly
      expect(transformPaginatedSpy).toHaveBeenCalledWith(
        firstPageSkillGroups,
        givenResourcesBaseUrl,
        limit,
        expectedNextCursor
      );
    });
    test("GET should return nextCursor when nextCursor is present in the paginated skill group result", async () => {
      // GIVEN role check passes for anonymous access
      checkRole.mockResolvedValueOnce(true);

      const limit = 1;
      const givenSkillGroups: Array<ISkillGroup> = [
        {
          ...getISkillGroupMockData(1, givenModelId),
          UUID: "foo",
          UUIDHistory: ["foo"],
          importId: randomUUID(),
        },
        {
          ...getISkillGroupMockData(2, givenModelId),
          UUID: "bar",
          UUIDHistory: ["bar"],
          importId: randomUUID(),
        },
      ];

      // AND a service that will successfully get the skill groups (returns 2 items for limit 1)
      const givenSkillGroupServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
        findPaginated: jest.fn().mockResolvedValue({
          items: [givenSkillGroups[0]],
          nextCursor: { _id: givenSkillGroups[1].id, createdAt: givenSkillGroups[0].createdAt },
        }),
        validateModelForSkillGroup: jest.fn().mockResolvedValue(null),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event and limit 1
      const actualResponse = await skillGroupHandler({
        ...givenEvent,
        queryStringParameters: { limit: limit.toString() },
        path: `/models/${givenModelId}/skillGroups`,
      } as never);

      // THEN expect the handler to return the OK status
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });

      // verify the service was called correctly
      expect(getServiceRegistry().skillGroup.findPaginated).toHaveBeenCalledWith(givenModelId, undefined, limit);
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
        [givenSkillGroups[0]],
        givenResourcesBaseUrl,
        limit,
        responseBody.nextCursor
      );
    });
    test("GET should respond with the BAD_REQUEST status code if the modelId is not passed as a path parameter", async () => {
      // AND GIVEN the repository fails to get the skillGroups
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
      checkRole.mockResolvedValueOnce(true);

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler({
        ...givenBadEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
        path: `/models//skillGroups`,
      } as never);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const parsedMissing = JSON.parse(actualResponse.body);
      expect(parsedMissing).toMatchObject({
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "modelId is missing in the path",
      });
      expect(typeof parsedMissing.details).toBe("string");
    });
    test("GET should respond with the BAD_REQUEST status code if the modelId is not correct model id", async () => {
      // AND GIVEN the repository fails to get the skillGroups
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
        path: `/models/foo/skillGroups`,
      };

      // AND the user is not model manager
      checkRole.mockResolvedValueOnce(true);

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler({
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
      // GIVEN the repository fails to get the skillGroups
      const firstPageCursorObject = {
        id: getMockStringId(1),
        createdAt: new Date(),
      };
      const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

      // AND the user is not model manager
      checkRole.mockResolvedValueOnce(true);

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler({
        ...givenEvent,
        queryStringParameters: { limit: "foo", cursor: firstPageCursor },
        path: `/models/${givenModelId}/skillGroups`,
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
      const givenSkillGroupServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn(),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
        validateModelForSkillGroup: jest
          .fn()
          .mockResolvedValue(ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;
      checkRole.mockResolvedValueOnce(true);
      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler({
        ...givenEvent,
        path: `/models/${givenModelId}/skillGroups`,
      } as never);

      // THEN expect the handler to return the NOT_FOUND status
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);

      // AND the response body contains the error information
      const expectedErrorBody = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
        message: "Model not found",
        details: `No model found with id: ${givenModelId}`,
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET should respond with the INTERNAL_SERVER_ERROR if the model validation failed to fetch data from database", async () => {
      // GIVEN a service that model does not exists
      const givenSkillGroupServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn(),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
        validateModelForSkillGroup: jest
          .fn()
          .mockResolvedValue(ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;
      checkRole.mockResolvedValueOnce(true);
      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler({
        ...givenEvent,
        path: `/models/${givenModelId}/skillGroups`,
      } as never);

      // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);

      // AND the response body contains the error information
      const expectedErrorBody = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "Failed to fetch the model details from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET should respond with the BAD_REQUEST if the cursor decoding failed", async () => {
      // GIVEN a service that model does not exists
      const givenSkillGroupServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn(),
        validateModelForSkillGroup: jest.fn(),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
        decodeCursor: jest.fn().mockImplementation(() => {
          throw new Error("Failed to decode cursor");
        }),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;
      checkRole.mockResolvedValueOnce(true);
      const cursor = Buffer.from(getRandomString(10)).toString("base64");
      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler({
        ...givenEvent,
        path: `/models/${givenModelId}/skillGroups`,
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
    test("GET should respond with the INTERNAL_SERVER_ERROR status code if the repository fails to get the skillGroups", async () => {
      // AND GIVEN the repository fails to get the skillGroups
      const firstPageCursorObject = {
        id: getMockStringId(1),
        createdAt: new Date(),
      };
      const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

      const givenSkillGroupRepositoryMock = {
        Model: undefined as never,
        hierarchyModel: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockRejectedValue(new Error("foo")),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(givenSkillGroupRepositoryMock);
      const limit = 2;

      // AND the user is not model manager
      checkRole.mockResolvedValueOnce(true);

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler({
        ...givenEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
        path: `/models/${givenModelId}/skillGroups`,
      } as never);

      // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "Failed to retrieve the skill groups from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    testMethodsNotAllowed([HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH], skillGroupHandler);
  });
  describe("GET individual skill group", () => {
    test("GET /models/{modelId}/skillGroups/{id} should return the skill group for a valid ID", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModelId = getMockStringId(1);
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND a repository that will successfully get the skill group
      const givenSkillGroup: ISkillGroup = {
        ...getISkillGroupMockData(1, givenModelId),
        id: givenSkillGroupId,
        UUID: "test-uuid",
        UUIDHistory: ["test-uuid"],
        importId: randomUUID(),
      };

      const givenSkillGroupServiceMock = {
        findById: jest.fn().mockResolvedValue(givenSkillGroup),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest.fn(),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);

      // THEN respond with the OK status code
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the transformation function is called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(givenSkillGroup, givenResourcesBaseUrl);
      // AND the handler to return the expected result
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
    });
    test("GET /models/{modelId}/skillGroups/{id} should respond with NOT_FOUND if model does not exist", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModelId = getMockStringId(1);
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      const givenSkillGroupServiceMock = {
        findById: jest.fn(),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest
          .fn()
          .mockResolvedValue(ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);

      // AND respond with the NOT_FOUND status
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
        message: "Model not found",
        details: `No model found with id: ${givenModelId}`,
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET /models/{modelId}/skillGroups/{id} should respond with INTERNAL_SERVER_ERROR if model validator function failed to fetch from db", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModelId = getMockStringId(1);
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      const givenSkillGroupServiceMock = {
        findById: jest.fn(),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest
          .fn()
          .mockResolvedValue(ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);

      // AND respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "Failed to fetch the model details from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET /models/{modelId}/skillGroups/{id} should response with BAD_REQUEST if the path validation failed ", async () => {
      jest.doMock("validator", () => ({
        ajvInstance: {
          getSchema: jest.fn(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const validateFn: any = jest.fn().mockReturnValue(false);

            validateFn.errors = [{ instancePath: "/id", message: "invalid id" }];

            return validateFn;
          }),
        },
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let handler: any;

      jest.isolateModules(() => {
        ({ handler = handler } = require("./index"));
      });

      const givenModelId = getMockStringId(100);
      const givenSkillGroupId = getMockStringId(100);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}`,
      } as never;
      // AND User has the required role
      checkRole.mockResolvedValue(true);

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await handler(givenEvent);

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

    test("GET /models/{modelId}/skillGroups/{id} should respond with BAD_REQUEST if modelId and id parsed from path are invalid", async () => {
      // GIVEN an event where pathParameters are missing, so the IDs are parsed from the path via pathToRegexp
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
        path: `/models/invalid-model-id/skillGroups/invalid-skill-group-id`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);

      // THEN respond with the BAD_REQUEST status due to JSON schema validation failure
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);

      const parsed = JSON.parse(actualResponse.body);
      expect(parsed).toMatchObject({
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      });
      expect(typeof parsed.details).toBe("string");
    });

    test("GET /models/{modelId}/skillGroups/{id} should respond with NOT_FOUND if skill group is not found", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: "foo",
        UUIDHistory: ["foo"],
        released: false,
      };
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModel.id.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModel.id}/skillGroups/${givenSkillGroupId}`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      const givenSkillGroupServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest.fn(),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);
      // THEN respond with the NOT_FOUND status
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
        message: "skill group not found",
        details: `No skill group found with id: ${givenSkillGroupId}`,
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("GET /models/{modelId}/skillGroups/{id} should respond with BAD_REQUEST if modelId is missing", async () => {
      const givenSkillGroupId = getMockStringId(2);

      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models//skillGroups/${givenSkillGroupId}`,
      } as never;

      // AND role check passes for anonymous access
      checkRole.mockResolvedValueOnce(true);

      // WHEN the skill group handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent as never);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const parsedMissing = JSON.parse(actualResponse.body);
      expect(parsedMissing).toMatchObject({
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "modelId is missing in the path",
      });
      expect(typeof parsedMissing.details).toBe("string");
    });
    test("GET /models/{modelId}/skillGroups/{id} should respond with INTERNAL_SERVER_ERROR if repository throws an error", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: "foo",
        UUIDHistory: ["foo"],
        released: false,
      };
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModel.id.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModel.id}/skillGroups/${givenSkillGroupId}`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      // AND a repository that will throw an error
      const givenSkillGroupRepositoryMock = {
        Model: undefined as never,
        hierarchyModel: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockRejectedValue(new Error("Database connection failed")),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(givenSkillGroupRepositoryMock);

      const givenSkillGroupServiceMock = {
        findById: jest.fn().mockRejectedValue(new Error("foo")),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([]),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest.fn(),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);

      // THEN respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "Failed to retrieve the skill group from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
  });

  describe("GET parents of skill group", () => {
    test("GET /models/{modelId}/skillGroups/{id}/parents should return the parents of a given skill group id", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModelId = getMockStringId(1);
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}/parents`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);
      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND a repository that will successfully get the parents of the skill group
      const givenSkillGroupParent: ISkillGroup = {
        ...getISkillGroupMockData(3, givenModelId),
        id: getMockStringId(3),
        UUID: "parent-uuid",
        UUIDHistory: ["parent-uuid"],
        importId: randomUUID(),
      };
      const givenSkillGroupServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findParents: jest.fn().mockResolvedValue([givenSkillGroupParent]),
        findChildren: jest.fn().mockResolvedValue([]),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest.fn(),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);
      // THEN respond with the OK status code
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the transformation function is called correctly
      expect(transformParentsSpy).toHaveBeenCalledWith([givenSkillGroupParent], givenResourcesBaseUrl, null, null);
    });
    test("GET /models/{modelId}/skillGroups/{id}/parents should respond with NOT_FOUND if skill group is not found", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModelId = getMockStringId(1);
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}/parents`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      const givenSkillGroupServiceMock = {
        findById: jest.fn(),
        findParents: jest.fn(),
        findChildren: jest.fn(),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest
          .fn()
          .mockResolvedValue(ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);
      // THEN respond with the NOT_FOUND status
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
        message: "Model not found",
        details: `No model found with id: ${givenModelId}`,
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET /models/{modelId}/skillGroups/{id}/parents should respond with INTERNAL_SERVER_ERROR if model validator function failed to fetch from db", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModelId = getMockStringId(1);
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}/parents`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);
      const givenSkillGroupServiceMock = {
        findById: jest.fn(),
        findParents: jest.fn(),
        findChildren: jest.fn(),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest
          .fn()
          .mockResolvedValue(ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);
      // THEN respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "Failed to fetch the model details from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET /models/{modelId}/skillGroups/{id}/parents should response with BAD_REQUEST if the path validation failed", async () => {
      jest.doMock("validator", () => ({
        ajvInstance: {
          getSchema: jest.fn(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const validateFn: any = jest.fn().mockReturnValue(false);

            validateFn.errors = [{ instancePath: "/id", message: "invalid id" }];

            return validateFn;
          }),
        },
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let handler: any;

      jest.isolateModules(() => {
        ({ handler = handler } = require("./index"));
      });
      const givenModelId = getMockStringId(100);
      const givenSkillGroupId = getMockStringId(100);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}/parents`,
      } as never;
      // AND User has the required role
      checkRole.mockResolvedValue(true);
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
        details: expect.stringContaining("modelId"),
      };
      // WHEN the skill group handler is invoked with the given event
      const actualResponse = await handler(givenEvent);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      });
      expect(typeof JSON.parse(actualResponse.body).details).toBe("string");
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET /models/{modelId}/skillGroups/{id}/parents should respond with BAD_REQUEST if modelId is missing", async () => {
      const givenSkillGroupId = getMockStringId(2);

      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/model//skillGroups/${givenSkillGroupId}/parents`,
      } as never;

      // AND role check passes for anonymous access
      checkRole.mockResolvedValueOnce(true);
      // WHEN the skill group handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent as never);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const parsedMissing = JSON.parse(actualResponse.body);
      expect(parsedMissing).toMatchObject({
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "modelId is missing in the path",
      });
      expect(typeof parsedMissing.details).toBe("string");
    });
    test("GET /models/{modelId}/skillGroups/{id}/parents should respond with INTERNAL_SERVER_ERROR if repository throws an error", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: "foo",
        UUIDHistory: ["foo"],
        released: false,
      };
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModel.id.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModel.id}/skillGroups/${givenSkillGroupId}/parents`,
      } as never;
      // AND User has the required role
      checkRole.mockResolvedValue(true);
      // AND a repository that will throw an error
      const givenSkillGroupRepositoryMock = {
        Model: undefined as never,
        hierarchyModel: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockRejectedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        findParents: jest.fn().mockResolvedValue(new Error("Database connection failed")),
        findChildren: jest.fn().mockResolvedValue(null),
      };
      jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(givenSkillGroupRepositoryMock);
      const givenSkillGroupServiceMock = {
        findById: jest.fn(),
        findParents: jest.fn().mockResolvedValue(new Error("foo")),
        findChildren: jest.fn(),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest.fn(),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);

      // THEN respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "Failed to retrieve the skill group parents from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
  });

  describe("GET children of skill group", () => {
    test("GET /models/{modelId}/skillGroups/{id}/children should return the children of a given skill group id", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModelId = getMockStringId(1);
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}/children`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);
      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND a repository that will successfully get the children of the skill group
      const givenSkillGroupChild: ISkillGroupChild = {
        ...getISkillGroupSkillTypedChildData(3, givenModelId),
      };
      const givenSkillGroupServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findParents: jest.fn().mockResolvedValue([]),
        findChildren: jest.fn().mockResolvedValue([givenSkillGroupChild]),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest.fn(),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;
      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);
      // THEN respond with the OK status code
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the transformation function is called correctly
      expect(transformChildrenSpy).toHaveBeenCalledWith([givenSkillGroupChild], givenResourcesBaseUrl, null, null);
    });
    test("GET /models/{modelId}/skillGroups/{id}/children should respond with NOT_FOUND if model not exist", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModelId = getMockStringId(1);
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}/children`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);
      const givenSkillGroupServiceMock = {
        findById: jest.fn(),
        findParents: jest.fn(),
        findChildren: jest.fn(),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest
          .fn()
          .mockResolvedValue(ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);
      // THEN respond with the NOT_FOUND status
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
        message: "Model not found",
        details: `No model found with id: ${givenModelId}`,
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET /models/{modelId}/skillGroups/{id}/children should respond with INTERNAL_SERVER_ERROR if model validator failed to fetch from db ", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModelId = getMockStringId(1);
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}/children`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);
      const givenSkillGroupServiceMock = {
        findById: jest.fn(),
        findParents: jest.fn(),
        findChildren: jest.fn(),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest
          .fn()
          .mockResolvedValue(ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;
      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);
      // THEN respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "Failed to fetch the model details from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET /models/{modelId}/skillGroups/{id}/children should response with BAD_REQUEST if the path validation failed", async () => {
      jest.doMock("validator", () => ({
        ajvInstance: {
          getSchema: jest.fn(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const validateFn: any = jest.fn().mockReturnValue(false);

            validateFn.errors = [{ instancePath: "/id", message: "invalid id" }];

            return validateFn;
          }),
        },
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let handler: any;

      jest.isolateModules(() => {
        ({ handler = handler } = require("./index"));
      });

      const givenModelId = getMockStringId(100);
      const givenSkillGroupId = getMockStringId(100);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skillGroups/${givenSkillGroupId}/children`,
      } as never;
      // AND User has the required role
      checkRole.mockResolvedValue(true);
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
        details: expect.stringContaining("modelId"),
      };
      // WHEN the skill group handler is invoked with the given event
      const actualResponse = await handler(givenEvent);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      });
      expect(typeof JSON.parse(actualResponse.body).details).toBe("string");
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    test("GET /models/{modelId}/skillGroups/{id}/children should respond with INTERNAL_SERVER_ERROR if repository throws an error", async () => {
      // GIVEN a valid request with modelId and skillGroup ID
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: "foo",
        UUIDHistory: ["foo"],
        released: false,
      };
      const givenSkillGroupId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModel.id.toString(), id: givenSkillGroupId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModel.id}/skillGroups/${givenSkillGroupId}/children`,
      } as never;
      // AND User has the required role
      checkRole.mockResolvedValue(true);
      // AND a repository that will throw an error
      const givenSkillGroupRepositoryMock = {
        Model: undefined as never,
        hierarchyModel: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockRejectedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        findParents: jest.fn().mockResolvedValue(null),
        findChildren: jest.fn().mockResolvedValue(new Error("Database connection failed")),
      };
      jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(givenSkillGroupRepositoryMock);
      const givenSkillGroupServiceMock = {
        findById: jest.fn(),
        findParents: jest.fn(),
        findChildren: jest.fn().mockResolvedValue(new Error("foo")),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkillGroup: jest.fn(),
      } as ISkillGroupService;
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;

      // WHEN the skillGroup handler is invoked with the given event
      const actualResponse = await skillGroupHandler(givenEvent);

      // THEN respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        message: "Failed to retrieve the skill group children from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
  });
});
