import "_test_utilities/consoleMock";

import ErrorAPISpecs from "api-specifications/error";
import * as authenticatorModule from "auth/authorizer";
import * as queryModule from "./query";
import * as responseModule from "./response";
import { OccupationGroupListController } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { IOccupationGroupService } from "../services/occupationGroup.service.type";
import { ModelForOccupationGroupValidationErrorCode, IOccupationGroup } from "../_shared/OccupationGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
import { getIOccupationGroupMockData } from "../_shared/testDataHelper";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "node:crypto";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { parseBooleanQueryParam } from "common/formatters/parseBooleanQueryParam";

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
const mockGetOccupationGroupsPathParameters = jest.mocked(queryModule.getOccupationGroupsPathParameters);
const mockTransformPaginated = jest.mocked(responseModule.transformPaginated);
const mockParseBooleanQueryParam = jest.mocked(parseBooleanQueryParam);
const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

describe("OccupationGroupListController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    getMockGetSchema().mockReset();
    mockGetOccupationGroupsPathParameters.mockReset();
    mockTransformPaginated.mockReset();
    mockParseBooleanQueryParam.mockReset();
    mockParseBooleanQueryParam.mockReturnValue(false);
    checkRole.mockResolvedValue(true);
    const mockServiceRegistry = {
      occupationGroup: {
        create: jest.fn(),
        findById: jest.fn(),
        findParent: jest.fn(),
        findPaginated: jest.fn(),
        validateModelForOccupationGroup: jest.fn(),
        findChildren: jest.fn(),
      } as IOccupationGroupService,
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
      queryStringParameters: queryStringParameters || {},
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
  }
  const givenModelId = getMockStringId(1);
  const givenEvent = {
    httpMethod: HTTP_VERBS.GET,
    headers: {},
    pathParameters: { modelId: givenModelId.toString() },
  };
  test("returns a paginated list of occupation groups", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    const paginatedResult = {
      items: [
        {
          id: "group-1",
          UUID: "uuid-1",
          UUIDHistory: ["uuid-1"],
          code: "123",
          originUri: "https://example.com/origin",
          preferredLabel: "Group label",
          altLabels: ["Alt label"],
          groupType: "ISCOGroup",
          description: "Description",
          parent: null,
          children: [],
          importId: "import-1",
          modelId: "model-1",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-02T00:00:00.000Z"),
        },
      ],
      nextCursor: null,
    };

    const transformed = { data: [{ id: "group-1" }], limit: 100, nextCursor: null };
    mockTransformPaginated.mockReturnValue(transformed as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest.fn().mockResolvedValue(null);
    mockServiceRegistry.occupationGroup.findPaginated = jest.fn().mockResolvedValue(paginatedResult);

    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups(buildEvent(`/models/${givenModelId}/occupationGroups`));

    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
    expect(mockTransformPaginated).toHaveBeenCalledWith(
      paginatedResult.items,
      "https://resources.example.com",
      100,
      null
    );
    expect(JSON.parse(actualResponse.body)).toEqual(transformed);
  });

  test("GET should return nextCursor when nextCursor is present in the paginated occupation group result", async () => {
    // GIVEN role check passes for anonymous access
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    checkRole.mockResolvedValueOnce(true);

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
    const expectedNextCursor = Buffer.from(
      JSON.stringify({
        id: givenOccupationGroups[1].id,
        createdAt: givenOccupationGroups[0].createdAt.toISOString(),
      })
    ).toString("base64");

    // AND a service that will successfully get the occupation groups (returns 2 items for limit 1)
    const givenOccupationGroupServiceMock = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      findParent: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockResolvedValue({
        items: [givenOccupationGroups[0]],
        nextCursor: { _id: givenOccupationGroups[1].id, createdAt: givenOccupationGroups[0].createdAt },
      }),
      validateModelForOccupationGroup: jest.fn().mockResolvedValue(null),
      findChildren: jest.fn().mockResolvedValue([]),
    } as IOccupationGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;
    mockTransformPaginated.mockReturnValue({
      data: [],
      limit,
      nextCursor: expectedNextCursor,
    } as never);

    // WHEN the occupationGroup handler is invoked with the given event and limit 1
    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups({
      ...givenEvent,
      queryStringParameters: { limit: limit.toString() },
      path: `/models/${givenModelId}/occupationGroups`,
    } as never);

    // THEN expect the handler to return the OK status
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(actualResponse.headers).toMatchObject({
      "Content-Type": "application/json",
    });

    // verify the service was called correctly
    expect(getServiceRegistry().occupationGroup.findPaginated).toHaveBeenCalledWith(
      givenModelId,
      undefined,
      limit,
      true,
      expect.any(Object)
    );
    // AND the response body contains a nextCursor (base64 encoded)
    const responseBody = JSON.parse(actualResponse.body);
    expect(responseBody.nextCursor).toBeDefined();
    expect(typeof responseBody.nextCursor).toBe("string");

    // Verify it's a valid base64 string by decoding it
    const decodedCursor = Buffer.from(responseBody.nextCursor, "base64").toString("utf-8");
    expect(JSON.parse(decodedCursor)).toHaveProperty("id");
    expect(JSON.parse(decodedCursor)).toHaveProperty("createdAt");
  });
  test("GET should respond with the BAD_REQUEST status code if the modelId is not passed as a path parameter", async () => {
    // AND GIVEN the repository fails to get the occupationGroups
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: null } as never);

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

    // WHEN the occupationGroup handler is invoked with the given event
    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups({
      ...givenBadEvent,
      queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      path: `/models//occupationGroups`,
    } as never);

    // THEN expect the handler to return the BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body contains the error information
    const parsedMissing = JSON.parse(actualResponse.body);
    expect(parsedMissing).toMatchObject({
      errorCode:
        OccupationGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
      message: "modelId is missing in the path",
    });
    expect(typeof parsedMissing.details).toBe("string");
  });
  test("GET should respond with the BAD_REQUEST status code if the modelId is not correct model id", async () => {
    // AND GIVEN the repository fails to get the occupationGroups
    const validatePathFunction = jest.fn().mockReturnValue(false);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: "foo" } as never);

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
      path: `/models/foo/occupationGroups`,
    };

    // AND the user is not model manager
    checkRole.mockResolvedValueOnce(true);

    // WHEN the occupationGroup handler is invoked with the given event
    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups({
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

  test("returns BAD_REQUEST when the query parameters fail validation", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(false);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: "model-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest.fn().mockResolvedValue(null);

    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups(
      buildEvent("/models/model-1/occupationGroups", { limit: "bad" })
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
    });
  });

  test("returns NOT_FOUND when the model does not exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValueOnce(validatePathFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: "model-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID);

    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups(buildEvent("/models/model-1/occupationGroups"));

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  test("GET should respond with the INTERNAL_SERVER_ERROR if the model validation failed to fetch data from database", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    // GIVEN a service that model does not exists
    const givenOccupationGroupServiceMock = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      findParent: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn(),
      findChildren: jest.fn(),
      validateModelForOccupationGroup: jest
        .fn()
        .mockResolvedValue(ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
    } as IOccupationGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;
    checkRole.mockResolvedValueOnce(true);
    // WHEN the occupationGroup handler is invoked with the given event
    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups({
      ...givenEvent,
      path: `/models/${givenModelId}/occupationGroups`,
    } as never);

    // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);

    // AND the response body contains the error information
    const expectedErrorBody = {
      errorCode:
        OccupationGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
      message: "Failed to fetch the model details from the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("GET should respond with the BAD_REQUEST if the cursor decoding failed", async () => {
    // GIVEN a service that model does not exists
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    const givenOccupationGroupServiceMock = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn(),
      findParent: jest.fn().mockResolvedValue(null),
      validateModelForOccupationGroup: jest.fn(),
      findChildren: jest.fn(),
    } as IOccupationGroupService;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup = givenOccupationGroupServiceMock;
    const decodeCursorSpy = jest.spyOn(queryModule, "decodeCursor").mockImplementation(() => {
      throw new Error("Failed to decode cursor");
    });
    checkRole.mockResolvedValueOnce(true);
    const cursor = Buffer.from(getRandomString(10)).toString("base64");
    // WHEN the occupationGroup handler is invoked with the given event
    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups({
      ...givenEvent,
      queryStringParameters: { cursor },
      path: `/models/${givenModelId}/occupationGroups`,
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
  test("GET should respond with the INTERNAL_SERVER_ERROR status code if the repository fails to get the occupationGroups", async () => {
    // AND GIVEN the repository fails to get the occupationGroups
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);

    const firstPageCursorObject = {
      id: getMockStringId(1),
      createdAt: new Date(),
    };
    const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

    const givenOccupationGroupRepositoryMock = {
      Model: undefined as never,
      hierarchyModel: undefined as never,
      create: jest.fn().mockResolvedValue(null),
      createMany: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockRejectedValue(new Error("foo")),
      getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
      getHistory: jest.fn().mockResolvedValue([]),
      findParent: jest.fn().mockResolvedValue(null),
      findChildren: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get").mockReturnValue(givenOccupationGroupRepositoryMock);
    const limit = 2;

    // AND the user is not model manager
    checkRole.mockResolvedValueOnce(true);

    // WHEN the occupationGroup handler is invoked with the given event
    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups({
      ...givenEvent,
      queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      path: `/models/${givenModelId}/occupationGroups`,
    } as never);

    // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
      message: "Failed to retrieve the occupation groups from the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should parse the 'root' query parameter and forward the result to the service as the root filter", async () => {
    // GIVEN path & query validation pass and the path resolves to the given modelId
    const validatePathFunction = jest.fn().mockReturnValue(true);
    const validateQueryFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema()
      .mockReturnValueOnce(validatePathFunction as never)
      .mockReturnValueOnce(validateQueryFunction as never);
    mockGetOccupationGroupsPathParameters.mockReturnValue({ modelId: givenModelId } as never);
    // AND a service that resolves to an empty page
    const expectedDefaultLimit = 100;
    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest.fn().mockResolvedValue(null);
    const givenFindPaginated = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
    mockServiceRegistry.occupationGroup.findPaginated = givenFindPaginated;
    mockTransformPaginated.mockReturnValue({ data: [], limit: expectedDefaultLimit, nextCursor: null } as never);
    // AND parseBooleanQueryParam will parse the raw 'root' query parameter to a known value
    const givenRawRoot = "some-raw-value";
    const givenParsedRoot = true;
    mockParseBooleanQueryParam.mockReturnValue(givenParsedRoot);

    // WHEN the occupationGroups handler is invoked with a 'root' query parameter
    const controller = new OccupationGroupListController();
    const actualResponse = await controller.getOccupationGroups(
      buildEvent(`/models/${givenModelId}/occupationGroups`, { root: givenRawRoot })
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
});
