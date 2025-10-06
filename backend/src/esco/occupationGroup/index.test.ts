import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "./transform";
import { handler as occupationGroupHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import { randomUUID } from "node:crypto";
import ErrorAPISpecs from "api-specifications/error";
import { getRandomString } from "_test_utilities/getMockRandomData";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import * as authenticatorModule from "auth/authenticator";
import { usersRequestContext } from "_test_utilities/dataModel";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupationGroup, IOccupationGroupHistoryReference } from "./OccupationGroup.types";
import { getIOccupationGroupMockData } from "./testDataHelper";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import {
  testMethodsNotAllowed,
  testRequestJSONMalformed,
  testRequestJSONSchema,
  testTooLargePayload,
  testUnsupportedMediaType,
} from "_test_utilities/stdRESTHandlerTests";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockReturnValue(true);

const transformSpy = jest.spyOn(transformModule, "transform");
const transformPaginatedSpy = jest.spyOn(transformModule, "transformPaginated");

describe("Test for occupationGroup handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      const givenModelId = getMockStringId(1);

      const givenPayload: OccupationGroupAPISpecs.Types.POST.Request.Payload = {
        modelId: givenModelId,
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
      } as never;

      // AND User has the required role
      checkRole.mockReturnValue(true);

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND the repository that will successfully create the occupationGroup
      const givenOccupationGroup: IOccupationGroup = getIOccupationGroupMockData();
      // AND a repository that will get the UUIDHistory for the given occupationGroup
      const givenUUIDHistoryDetail: IOccupationGroupHistoryReference[] = [
        {
          code: getMockRandomISCOGroupCode(),
          preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
          UUID: givenPayload.UUIDHistory[0],
          id: getMockStringId(2),
          objectType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
        },
      ];

      const givenOccupationGroupRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue({
          ...givenOccupationGroup,
        }),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        encodeCursor: jest.fn().mockResolvedValue(""),
        decodeCursor: jest.fn().mockResolvedValue({}),
        getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue(givenUUIDHistoryDetail),
      };
      jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get").mockReturnValue(givenOccupationGroupRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // THEN expect the handler to call the repository with the given payload
      expect(getRepositoryRegistry().OccupationGroup.create).toHaveBeenCalledWith({ ...givenPayload, importId: null });
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

      // AND User has the required role
      checkRole.mockReturnValue(true);

      const givenOccupationGroupRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockRejectedValue(new Error("foo")),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        encodeCursor: jest.fn().mockResolvedValue(""),
        decodeCursor: jest.fn().mockResolvedValue({}),
        getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get").mockReturnValue(givenOccupationGroupRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationGroupHandler(givenEvent);

      // THEN expect the handler to call the repository with the given payload
      expect(getRepositoryRegistry().OccupationGroup.create).toHaveBeenCalledWith({ ...givenPayload, importId: null });
      // AND to respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: OccupationGroupAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        message: "Failed to create the occupation group in the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    testUnsupportedMediaType(occupationGroupHandler);
    testRequestJSONSchema(occupationGroupHandler);
    testRequestJSONMalformed(occupationGroupHandler);
    testTooLargePayload(HTTP_VERBS.POST, OccupationGroupAPISpecs.Constants.MAX_PAYLOAD_LENGTH, occupationGroupHandler);
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
  });

  describe("GET", () => {
    // GIVEN a valid GET request (method & header)
    const givenModelId = getMockStringId(1);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      pathParameters: { modelId: givenModelId.toString() },
      queryStringParameters: {},
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
          importId: null,
        },
        {
          ...getIOccupationGroupMockData(2, givenModelId),
          UUID: "bar",
          UUIDHistory: ["bar"],
          importId: null,
        },
        {
          ...getIOccupationGroupMockData(3, givenModelId),
          UUID: "baz",
          UUIDHistory: ["baz"],
          importId: null,
        },
      ];

      const firstPageOccupationGroups = givenOccupationGroups.slice(-2);

      const limit = 2;
      const firstPageCursor = Buffer.from(
        JSON.stringify({ id: givenOccupationGroups[2].id, createdAt: givenOccupationGroups[2].createdAt })
      ).toString("base64");

      const expectedNextCursor = Buffer.from(
        JSON.stringify({ id: givenOccupationGroups[0].id, createdAt: givenOccupationGroups[0].createdAt })
      ).toString("base64");

      // AND the user is not model manager
      checkRole.mockReturnValueOnce(false);

      // AND a repository that will successfully get the limited occupationGroups
      const givenOccupationGroupRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockReturnValue({
          items: firstPageOccupationGroups,
          nextCursor: { _id: givenOccupationGroups[0].id, createdAt: givenOccupationGroups[0].createdAt },
        }),
        encodeCursor: jest.fn().mockReturnValue(expectedNextCursor),
        decodeCursor: jest
          .fn()
          .mockReturnValue({ id: givenOccupationGroups[2].id, createdAt: givenOccupationGroups[2].createdAt }),
        getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(getRepositoryRegistry(), "OccupationGroup", "get")
        .mockClear()
        .mockReturnValue(givenOccupationGroupRepositoryMock);

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
    test("GET should respond with the BAD_REQUEST status code if the modelId is not passed as a path parameter", async () => {
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
        encodeCursor: jest.fn().mockReturnValue(firstPageCursor),
        decodeCursor: jest.fn().mockReturnValue(firstPageCursorObject),
        getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get").mockReturnValue(givenOccupationGroupRepositoryMock);
      const limit = 2;

      const givenBadEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        queryStringParameters: {},
      };

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
        errorCode: OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
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

      const givenOccupationGroupRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockRejectedValue(new Error("foo")),
        encodeCursor: jest.fn().mockReturnValue(firstPageCursor),
        decodeCursor: jest.fn().mockReturnValue(firstPageCursorObject),
        getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get").mockReturnValue(givenOccupationGroupRepositoryMock);
      const limit = 2;

      const givenBadEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: "foo" },
        queryStringParameters: {},
      };

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
        encodeCursor: jest.fn().mockReturnValue(firstPageCursor),
        decodeCursor: jest.fn().mockReturnValue(firstPageCursorObject),
        getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get").mockReturnValue(givenOccupationGroupRepositoryMock);

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
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      });
      expect(typeof parsedInvalidQuery.details).toBe("string");
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
        encodeCursor: jest.fn().mockReturnValue(firstPageCursor),
        decodeCursor: jest.fn().mockReturnValue(firstPageCursorObject),
        getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get").mockReturnValue(givenOccupationGroupRepositoryMock);
      const limit = 2;

      // WHEN the occupationGroup handler is invoked with the given event
      const actualResponse = await occupationGroupHandler({
        ...givenEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      } as never);

      // THEN expect the handler to call the repository to get the occupationGroups
      expect(getRepositoryRegistry().OccupationGroup.findPaginated).toHaveBeenCalled();
      // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
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
});
