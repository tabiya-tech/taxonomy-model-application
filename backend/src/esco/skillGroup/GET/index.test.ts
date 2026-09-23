import "_test_utilities/consoleMock";
import ErrorAPISpecs from "api-specifications/error";
import * as authenticatorModule from "auth/authorizer";
import * as queryModule from "./query";
import * as responseModule from "./response";
import { SkillGroupListController, handler as exportedHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { ISkillGroupService } from "../services/skillGroup.service.type";
import { ModelForSkillGroupValidationErrorCode, ISkillGroup } from "../_shared/skillGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
import { getISkillGroupMockData } from "../_shared/testDataHelper";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "node:crypto";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { parseBooleanQueryParam } from "common/formatters/parseBooleanQueryParam";
import { EmbeddableField } from "embeddings/service/types";

jest.mock("server/serviceRegistry/serviceRegistry");
jest.mock("./query");
jest.mock("./response");
jest.mock("common/formatters/parseBooleanQueryParam");
jest.mock("validator", () => ({
  ajvInstance: {
    getSchema: jest.fn(),
  },
}));

const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const mockGetSkillGroupsPathParameters = jest.mocked(queryModule.getSkillGroupsPathParameters);
const mockDecodeCursor = jest.mocked(queryModule.decodeCursor);
const mockTransformPaginated = jest.mocked(responseModule.transformPaginated);
const mockParseBooleanQueryParam = jest.mocked(parseBooleanQueryParam);
const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

describe("SkillGroupListController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    getMockGetSchema().mockReset();
    mockGetSkillGroupsPathParameters.mockReset();
    mockDecodeCursor.mockReset();
    mockTransformPaginated.mockReset();
    mockParseBooleanQueryParam.mockReset();
    mockParseBooleanQueryParam.mockReturnValue(false);
    checkRole.mockResolvedValue(true);
    const mockServiceRegistry = {
      skillGroup: {
        findById: jest.fn(),
        findParents: jest.fn(),
        findPaginated: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForSkillGroup: jest.fn(),
        findChildren: jest.fn(),
        getHistory: jest.fn(),
        setParent: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        patch: jest.fn(),
      } as ISkillGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
    getResourcesBaseUrlSpy.mockReturnValue("https://resources.example.com");
  });

  function buildEvent(path: string, queryStringParameters?: Record<string, string>) {
    return {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      path,
      pathParameters: { modelId: "model-1" },
      queryStringParameters,
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
  }
  const givenModelId = getMockStringId(1);
  const givenEvent = {
    httpMethod: HTTP_VERBS.GET,
    headers: {},
    pathParameters: { modelId: givenModelId.toString() },
  };
  test("GET should return only the skillGroups for the given modelId", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    const paginatedResult = {
      items: [
        {
          ...getISkillGroupMockData(1, givenModelId),
          UUID: "foo",
          UUIDHistory: ["foo"],
          importId: randomUUID(),
        },
      ],
      nextCursor: null,
    };

    // AND the user is not model manager
    const transformed = { data: [{ id: "group-1" }], limit: 100, nextCursor: null };
    mockTransformPaginated.mockReturnValue(transformed as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.skillGroup.findPaginated = jest.fn().mockResolvedValue(paginatedResult);

    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(buildEvent(`/models/${givenModelId}/skill-groups`));

    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockTransformPaginated).toHaveBeenCalledWith(
      paginatedResult.items,
      "https://resources.example.com",
      100,
      null
    );
    expect(JSON.parse(actualResponse.body)).toEqual(transformed);
  });
  test("GET should delegate to searchPaginated when a query is provided and pass through its encoded cursor", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    // GIVEN the search service returns a page with an already-encoded nextCursor
    const givenItems = [{ ...getISkillGroupMockData(1, givenModelId), UUID: "foo", UUIDHistory: ["foo"] }];
    const givenNextCursor = "nextOpaqueCursor";
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.skillGroup.searchPaginated = jest
      .fn()
      .mockResolvedValue({ items: givenItems, nextCursor: givenNextCursor });
    const transformed = { data: [{ id: "group-1" }], limit: 100, nextCursor: givenNextCursor };
    mockTransformPaginated.mockReturnValue(transformed as never);

    // WHEN searching with a query and explicit searchFields (no cursor)
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(
      buildEvent(`/models/${givenModelId}/skillGroups`, {
        query: "data",
        searchFields: "preferredLabel,description",
      })
    );

    // THEN expect OK and the search path to have been used (not the plain list path)
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockServiceRegistry.skillGroup.searchPaginated).toHaveBeenCalledWith(
      givenModelId,
      "data",
      [EmbeddableField.preferredLabel, EmbeddableField.description],
      undefined,
      100
    );
    expect(mockServiceRegistry.skillGroup.findPaginated).not.toHaveBeenCalled();
    // AND the response to be built with the service's already-encoded nextCursor
    expect(mockTransformPaginated).toHaveBeenCalledWith(
      givenItems,
      "https://resources.example.com",
      100,
      givenNextCursor
    );
    expect(JSON.parse(actualResponse.body)).toEqual(transformed);
  });

  function setupSearchTest() {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.skillGroup.searchPaginated = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
    mockTransformPaginated.mockReturnValue({ data: [], limit: 100, nextCursor: null } as never);
    return mockServiceRegistry;
  }

  test("GET should accept a well-formed keyset cursor when searching and pass it verbatim to searchPaginated", async () => {
    const mockServiceRegistry = setupSearchTest();

    // GIVEN a cursor that decodes to a payload with a valid ObjectId id (keyset pagination strategy)
    const givenCursor = "opaqueKeysetCursor";
    mockDecodeCursor.mockReturnValue({ id: getMockStringId(2), createdAt: new Date() } as never);

    // WHEN searching with a query and the well-formed keyset cursor
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(
      buildEvent(`/models/${givenModelId}/skillGroups`, {
        query: "data",
        cursor: givenCursor,
      })
    );

    // THEN expect OK and the cursor to be forwarded verbatim to the search service
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockServiceRegistry.skillGroup.searchPaginated).toHaveBeenCalledWith(
      givenModelId,
      "data",
      [EmbeddableField.preferredLabel],
      givenCursor,
      100
    );
  });

  test("GET should accept a well-formed search cursor when searching and pass it verbatim to searchPaginated", async () => {
    const mockServiceRegistry = setupSearchTest();

    // GIVEN a cursor that is not decodable as a keyset cursor but is a valid vector-search offset cursor
    const givenCursor = Buffer.from(JSON.stringify({ offset: 3 })).toString("base64");
    mockDecodeCursor.mockImplementation(() => {
      throw new Error("Not a keyset cursor");
    });

    // WHEN searching with a query and the well-formed search cursor
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(
      buildEvent(`/models/${givenModelId}/skillGroups`, {
        query: "data",
        cursor: givenCursor,
      })
    );

    // THEN expect OK and the cursor to be forwarded verbatim to the search service
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockServiceRegistry.skillGroup.searchPaginated).toHaveBeenCalledWith(
      givenModelId,
      "data",
      [EmbeddableField.preferredLabel],
      givenCursor,
      100
    );
  });

  test("GET should accept a keyset cursor whose id is not a valid ObjectId when it is a valid search cursor", async () => {
    const mockServiceRegistry = setupSearchTest();

    // GIVEN a cursor that decodes as a keyset payload but holds an invalid ObjectId id,
    // AND is a valid vector-search offset cursor
    const givenCursor = Buffer.from(JSON.stringify({ offset: 0 })).toString("base64");
    mockDecodeCursor.mockReturnValue({ id: "not-an-object-id", createdAt: new Date() } as never);

    // WHEN searching with a query and this cursor
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(
      buildEvent(`/models/${givenModelId}/skillGroups`, {
        query: "data",
        cursor: givenCursor,
      })
    );

    // THEN expect OK and the cursor to be forwarded verbatim to the search service
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockServiceRegistry.skillGroup.searchPaginated).toHaveBeenCalledWith(
      givenModelId,
      "data",
      [EmbeddableField.preferredLabel],
      givenCursor,
      100
    );
  });

  test("GET returns BAD_REQUEST when searching with an ill-formed cursor", async () => {
    setupSearchTest();

    // GIVEN a cursor that can be decoded neither as a keyset cursor nor as a search cursor
    const givenCursor = Buffer.from(getRandomString(10)).toString("base64");
    mockDecodeCursor.mockImplementation(() => {
      throw new Error("Not a keyset cursor");
    });

    // WHEN searching with a query and the ill-formed cursor
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(
      buildEvent(`/models/${givenModelId}/skillGroups`, {
        query: "data",
        cursor: givenCursor,
      })
    );

    // THEN expect BAD_REQUEST with the invalid cursor error
    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    const expectedErrorBody: ErrorAPISpecs.Types.GET = {
      errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
      message: "Invalid cursor parameter",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    // AND expect the search service not to have been called
    expect(mockGetServiceRegistry().skillGroup.searchPaginated).not.toHaveBeenCalled();
  });

  test("GET should return nextCursor when nextCursor is present in the paginated skill group result", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

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
    const expectedNextCursor = Buffer.from(
      JSON.stringify({
        id: givenSkillGroups[1].id,
        createdAt: givenSkillGroups[0].createdAt.toISOString(),
      })
    ).toString("base64");

    // AND a service that will successfully get the skill groups (return 2 items for limit 1)
    const givenSkillGroupServiceMock = {
      findById: jest.fn().mockResolvedValue(null),
      findParents: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockResolvedValue({
        items: [givenSkillGroups[0]],
        nextCursor: { _id: givenSkillGroups[1].id, createdAt: givenSkillGroups[0].createdAt },
      }),
      searchPaginated: jest.fn(),
      validateModelForSkillGroup: jest.fn().mockResolvedValue(null),
      findChildren: jest.fn().mockResolvedValue([]),
      getHistory: jest.fn(),
      setParent: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      patch: jest.fn(),
    } as ISkillGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;
    mockTransformPaginated.mockReturnValue({
      data: [],
      limit,
      nextCursor: expectedNextCursor,
    } as never);

    // WHEN the skillGroup handler is invoked with the given event and limit 1
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups({
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
    expect(getServiceRegistry().skillGroup.findPaginated).toHaveBeenCalledWith(givenModelId, undefined, limit, true, {
      root: false,
    });
    // AND the response body contains a nextCursor (base64 encoded)
    const responseBody = JSON.parse(actualResponse.body);
    expect(responseBody.nextCursor).toBeDefined();
    expect(typeof responseBody.nextCursor).toBe("string");

    // Verify it's a valid base64 string by decoding it
    const decodedCursor = Buffer.from(responseBody.nextCursor, "base64").toString("utf-8");
    expect(JSON.parse(decodedCursor)).toHaveProperty("id");
    expect(JSON.parse(decodedCursor)).toHaveProperty("createdAt");
  });
  test("GET skillGroups should default query parameters when they are omitted", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.skillGroup.findPaginated = jest.fn().mockResolvedValue({ items: [], nextCursor: null });

    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(buildEvent(`/models/${givenModelId}/skillGroups`));

    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockServiceRegistry.skillGroup.findPaginated).toHaveBeenCalledWith(givenModelId, undefined, 100, true, {
      root: false,
    });
  });
  test("GET skillGroups should forward children filters when both childrenIds and childrenType are provided", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.skillGroup.findPaginated = jest.fn().mockResolvedValue({ items: [], nextCursor: null });

    const childrenIds = `${getMockStringId(2)};${getMockStringId(3)}`;
    const childrenType = SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.SkillGroup;

    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(
      buildEvent(`/models/${givenModelId}/skillGroups`, { childrenIds, childrenType })
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockServiceRegistry.skillGroup.findPaginated).toHaveBeenCalledWith(givenModelId, undefined, 100, true, {
      root: false,
      childrenIds,
      childrenType,
    });
  });

  test("GET skillGroups should parse the 'root' query parameter and forward the result to the service as the root filter", async () => {
    // GIVEN path & query validation pass and the path resolves to the given modelId
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    // AND a service that resolves to an empty page
    const expectedDefaultLimit = 100;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);
    const givenFindPaginated = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
    mockServiceRegistry.skillGroup.findPaginated = givenFindPaginated;
    mockTransformPaginated.mockReturnValue({ data: [], limit: expectedDefaultLimit, nextCursor: null } as never);

    // AND parseBooleanQueryParam will parse the raw 'root' query parameter to a known value
    const givenRawRoot = "some-raw-value";
    const givenParsedRoot = true;
    mockParseBooleanQueryParam.mockReturnValue(givenParsedRoot);

    // WHEN the skillGroups handler is invoked with a 'root' query parameter
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(
      buildEvent(`/models/${givenModelId}/skillGroups`, { root: givenRawRoot })
    );

    // THEN expect the handler to return the OK status
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    // AND expect the raw 'root' query parameter to have been parsed
    expect(mockParseBooleanQueryParam).toHaveBeenCalledWith(givenRawRoot);
    // AND expect the parsed value to be forwarded to the service as the root filter
    expect(givenFindPaginated).toHaveBeenCalledWith(givenModelId, undefined, expectedDefaultLimit, true, {
      root: givenParsedRoot,
    });
  });
  test("GET skillGroups should respond with the BAD_REQUEST status code if the modelId is not passed as a path parameter", async () => {
    // AND GIVEN the repository fails to get the occupationGroups
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: null } as never);

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
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups({
      ...givenBadEvent,
      queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      path: `/models//skillGroups`,
    } as never);

    // THEN expect the handler to return the BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body contains the error information
    const parsedMissing = JSON.parse(actualResponse.body);
    expect(parsedMissing).toMatchObject({
      errorCode: SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
      message: "modelId is missing in the path",
    });
    expect(typeof parsedMissing.details).toBe("string");
  });
  test("GET SkillGroup should respond with the BAD_REQUEST status code if the modelId is not correct model id", async () => {
    // AND GIVEN the repository fails to get the occupationGroups
    const validatePathFunction = jest.fn().mockReturnValue(false);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: "foo" } as never);

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
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups({
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
  test("GET SkillGroup returns BAD_REQUEST when the query parameters fail validation", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(false);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: "model-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);

    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(buildEvent("/models/model-1/skillGroups", { limit: "bad" }));

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
    });
  });

  test("GET SkillGroup returns NOT_FOUND when the model does not exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValueOnce(validatePathFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: "model-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest
      .fn()
      .mockResolvedValue(ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID);

    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups(buildEvent("/models/model-1/skillGroups"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
  });
  test("GET skillGroups should respond with the INTERNAL_SERVER_ERROR if the model validation failed to fetch data from database", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    // GIVEN a service that model does not exists
    const givenSkillGroupServiceMock = {
      findById: jest.fn().mockResolvedValue(null),
      findParents: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn(),
      searchPaginated: jest.fn(),
      findChildren: jest.fn(),
      validateModelForSkillGroup: jest
        .fn()
        .mockResolvedValue(ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      getHistory: jest.fn(),
      setParent: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      patch: jest.fn(),
    } as ISkillGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;
    checkRole.mockResolvedValueOnce(true);
    // WHEN the skillGroup handler is invoked with the given event
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups({
      ...givenEvent,
      path: `/models/${givenModelId}/skillGroups`,
    } as never);

    // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);

    // AND the response body contains the error information
    const expectedErrorBody = {
      errorCode: SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
      message: "Failed to fetch the model details from the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });
  test("GET skillGroups should respond with the BAD_REQUEST if the cursor decoding failed", async () => {
    // GIVEN a service that model does not exists
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    const givenSkillGroupServiceMock = {
      findById: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn(),
      searchPaginated: jest.fn(),
      findParents: jest.fn().mockResolvedValue(null),
      validateModelForSkillGroup: jest.fn(),
      findChildren: jest.fn(),
      getHistory: jest.fn(),
      setParent: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      patch: jest.fn(),
    } as ISkillGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;
    const decodeCursorSpy = jest.spyOn(queryModule, "decodeCursor").mockImplementation(() => {
      throw new Error("Failed to decode cursor");
    });
    checkRole.mockResolvedValueOnce(true);
    const cursor = Buffer.from(getRandomString(10)).toString("base64");
    // WHEN the skillGroup handler is invoked with the given event
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups({
      ...givenEvent,
      queryStringParameters: { cursor },
      path: `/models/${givenModelId}/skillGroups`,
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
    decodeCursorSpy.mockRestore();
  });

  test("GET skillGroups should respond with the INTERNAL_SERVER_ERROR status code if the repository fails to get the occupationGroups", async () => {
    // AND GIVEN the repository fails to get the occupationGroups
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

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
      findByIds: jest.fn().mockResolvedValue([]),
      findParents: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      findChildren: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      findHistoryReferencesByUUIDs: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(null),
      patch: jest.fn().mockResolvedValue(null),
      setEntityEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
      setModelEntitiesEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
      createManyLocalized: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(givenSkillGroupRepositoryMock);
    const limit = 2;

    // AND the user is not model manager
    checkRole.mockResolvedValueOnce(true);

    // WHEN the skillGroup handler is invoked with the given event
    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups({
      ...givenEvent,
      queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      path: `/models/${givenModelId}/skillGroups`,
    } as never);

    // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
      message: "Failed to retrieve the skill groups from the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });
  test("GET skillGroups should log unknown errors from the repository as Unknown error", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    const givenSkillGroupServiceMock = {
      findById: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockRejectedValue("repository failed"),
      searchPaginated: jest.fn(),
      findParents: jest.fn().mockResolvedValue(null),
      validateModelForSkillGroup: jest.fn().mockResolvedValue(null),
      findChildren: jest.fn().mockResolvedValue(null),
      getHistory: jest.fn(),
      setParent: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      patch: jest.fn(),
    } as ISkillGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup = givenSkillGroupServiceMock;
    checkRole.mockResolvedValueOnce(true);

    const controller = new SkillGroupListController();
    const actualResponse = await controller.getSkillGroups({
      ...givenEvent,
      queryStringParameters: { limit: "2" },
      path: `/models/${givenModelId}/skillGroups`,
    } as never);

    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
      message: "Failed to retrieve the skill groups from the DB",
      details: "",
    });
  });

  test("should return the response from the exported handler", async () => {
    // GIVEN a valid GET request event
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetSkillGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.skillGroup.validateModelForSkillGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.skillGroup.findPaginated = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
    mockTransformPaginated.mockReturnValue({ data: [], limit: 100, nextCursor: null } as never);

    // WHEN calling the exported handler
    const actualResponse = await exportedHandler(buildEvent(`/models/${givenModelId}/skillGroups`) as never);

    // THEN expect the OK status
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });
});
