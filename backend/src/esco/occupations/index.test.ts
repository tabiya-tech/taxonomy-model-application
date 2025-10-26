import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "./transform";
import { handler as occupationHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

import { randomUUID } from "node:crypto";
import ErrorAPISpecs from "api-specifications/error";
import { getRandomString } from "_test_utilities/getMockRandomData";
import OccupationAPISpecs from "api-specifications/esco/occupation";

import * as authenticatorModule from "auth/authenticator";
import { usersRequestContext } from "_test_utilities/dataModel";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupation } from "./occupation.types";
import { getIOccupationMockData } from "./testDataHelper";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { Routes } from "routes.constant";
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

describe("Test for occupation handler", () => {
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
        const actualResponse = await occupationHandler(givenEvent);

        // THEN expect the handler to respond with the FORBIDDEN status
        expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      });
    });

    test("POST should response with the CREATED status code and the newly created occupation for a valid and max size payload", async () => {
      // GIVEN a valid request (method & header & payload)
      const givenModelId = getMockStringId(1);

      const givenPayload: OccupationAPISpecs.Types.POST.Request.Payload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        altLabels: [
          getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
          getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
        ],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
        scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        isLocalized: false,
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

      // AND the repository that will successfully create the occupation
      const givenOccupation: IOccupation = getIOccupationMockData();
      // AND a repository that will get the UUIDHistory for the given occupation
      const givenOccupationRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue({
          ...givenOccupation,
        }),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        encodeCursor: jest.fn().mockReturnValue(""),
        decodeCursor: jest.fn().mockReturnValue({}),
        getOccupationByUUID: jest.fn().mockResolvedValue(null),
      };
      jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect the handler to call the repository with the given payload
      expect(getRepositoryRegistry().occupation.create).toHaveBeenCalledWith({ ...givenPayload, importId: null });
      // AND respond with the CREATED status code
      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the transformation function is called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(
        {
          ...givenOccupation,
        },
        givenResourcesBaseUrl
      );
      // AND the handler to return the expected result
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
    });
    test("POST should respond with the INTERNAL_SERVER_ERROR status code if the repository failed to create the occupation", async () => {
      // GIVEN a valid request {method & header & payload}
      const givenModelId = getMockStringId(1);

      const givenPayload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: "some random label",
        description: "some random description",
        altLabels: ["some random alt label 1", "some random alt label 2"],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: "some definition",
        scopeNote: "some scope note",
        regulatedProfessionNote: "some regulated profession note",
        isLocalized: false,
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

      const givenOccupationRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockRejectedValue(new Error("foo")),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        encodeCursor: jest.fn().mockReturnValue(""),
        decodeCursor: jest.fn().mockReturnValue({}),
        getOccupationByUUID: jest.fn().mockResolvedValue(null),
      };
      jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect the handler to call the repository with the given payload
      expect(getRepositoryRegistry().occupation.create).toHaveBeenCalledWith({ ...givenPayload, importId: null });
      // AND to respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: OccupationAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
        message: "Failed to create the occupation in the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });
    testUnsupportedMediaType(occupationHandler);
    testRequestJSONSchema(occupationHandler);
    testRequestJSONMalformed(occupationHandler);
    testTooLargePayload(HTTP_VERBS.POST, OccupationAPISpecs.Constants.MAX_PAYLOAD_LENGTH, occupationHandler);
    test("POST should return FORBIDDEN status code if the user does not have the required role", async () => {
      // GIVEN a valid request (method & header & payload)
      const givenModelId = getMockStringId(1);

      const givenPayload = {
        modelId: givenModelId,
        code: "1234.5678",
        occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
        preferredLabel: "some random label",
        description: "some random description",
        altLabels: ["some random alt label 1", "some random alt label 2"],
        originUri: `http://some/path/to/api/resources/${randomUUID()}`,
        UUIDHistory: [randomUUID()],
        occupationGroupCode: getMockRandomISCOGroupCode(),
        definition: "some definition",
        scopeNote: "some scope note",
        regulatedProfessionNote: "some regulated profession note",
        isLocalized: false,
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

      // WHEN the occupation handler is invoked with the given event
      const actualResponse = await occupationHandler(givenEvent);

      // THEN expect the handler to return the FORBIDDEN status
      expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });
  });

  describe("GET", () => {
    describe("GET /occupations/{id}", () => {
      const givenModelId = getMockStringId(1);
      const givenId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        path: `/models/${givenModelId}/occupations/${givenId}`,
        pathParameters: { modelId: givenModelId, id: givenId },
        queryStringParameters: {},
      };

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);

      test("GET /occupations/{id} should return the occupation for the given id", async () => {
        // GIVEN a repository that will successfully get the occupation
        const givenOccupation: IOccupation = getIOccupationMockData();

        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          encodeCursor: jest.fn().mockReturnValue(""),
          decodeCursor: jest.fn().mockReturnValue({}),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the transformation function is called correctly
        expect(transformModule.transform).toHaveBeenCalledWith(givenOccupation, givenResourcesBaseUrl);
        // AND the handler to return the expected result
        expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
      });

      test("GET /occupations/{id} should respond with NOT_FOUND if the occupation does not exist", async () => {
        // GIVEN a repository that returns null for the occupation
        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(null),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          encodeCursor: jest.fn().mockReturnValue(""),
          decodeCursor: jest.fn().mockReturnValue({}),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the NOT_FOUND status
        expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
        // AND the response body contains the error information
        const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Occupation not found",
          details: JSON.stringify({ id: givenId }),
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if modelId is missing", async () => {
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models//occupations/${givenId}`,
          pathParameters: { id: givenId },
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenBadEvent as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedMissing = JSON.parse(actualResponse.body);
        expect(parsedMissing).toMatchObject({
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "modelId is missing in the path",
        });
        expect(typeof parsedMissing.details).toBe("string");
      });

      test("GET /occupations/{id} should extract modelId from path when pathParameters.modelId is not set", async () => {
        // GIVEN a repository that will successfully get the occupation
        const givenOccupation: IOccupation = getIOccupationMockData();

        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          encodeCursor: jest.fn().mockReturnValue(""),
          decodeCursor: jest.fn().mockReturnValue({}),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);

        const givenEventWithoutPathParams = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations/${givenId}`,
          pathParameters: { id: givenId }, // modelId not set
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEventWithoutPathParams as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the transformation function is called correctly
        expect(transformModule.transform).toHaveBeenCalledWith(givenOccupation, givenResourcesBaseUrl);
        // AND the handler to return the expected result
        expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
      });

      test("GET /occupations/{id} should extract id from path when pathParameters.id is not set", async () => {
        // GIVEN a repository that will successfully get the occupation
        const givenOccupation: IOccupation = getIOccupationMockData();

        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(givenOccupation),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          encodeCursor: jest.fn().mockReturnValue(""),
          decodeCursor: jest.fn().mockReturnValue({}),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);

        const givenEventWithoutIdParams = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations/${givenId}`,
          pathParameters: { modelId: givenModelId }, // id not set
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEventWithoutIdParams as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the transformation function is called correctly
        expect(transformModule.transform).toHaveBeenCalledWith(givenOccupation, givenResourcesBaseUrl);
        // AND the handler to return the expected result
        expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if id is missing", async () => {
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations/${givenId}`, // has id segment
          pathParameters: { modelId: givenModelId, id: "" }, // id is empty string
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenBadEvent as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedMissing = JSON.parse(actualResponse.body);
        expect(parsedMissing).toMatchObject({
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "id is missing in the path",
        });
        expect(typeof parsedMissing.details).toBe("string");
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if modelId is invalid", async () => {
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${getMockStringId(1)}/occupations/${givenId}`,
          pathParameters: { modelId: "foo", id: givenId },
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenBadEvent as never);

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

      test("GET /occupations/{id} should respond with INTERNAL_SERVER_ERROR if the repository fails", async () => {
        // GIVEN a repository that fails to get the occupation
        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockRejectedValue(new Error("foo")),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          encodeCursor: jest.fn().mockReturnValue(""),
          decodeCursor: jest.fn().mockReturnValue({}),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler(givenEvent as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to retrieve the occupation from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if id cannot be extracted from path or pathParameters", async () => {
        // Mock the route regex to return undefined for ID to cover the unreachable code path
        const originalExec = Routes.OCCUPATION_BY_ID_ROUTE.exec;
        Routes.OCCUPATION_BY_ID_ROUTE.exec = jest.fn().mockReturnValue([null, getMockStringId(1), undefined]);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${getMockStringId(1)}/occupations/some-id`,
          pathParameters: { modelId: getMockStringId(1) }, // id missing
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("id is missing in the path");
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS);

        // Restore
        Routes.OCCUPATION_BY_ID_ROUTE.exec = originalExec;
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if modelId cannot be extracted from path or pathParameters", async () => {
        // Mock the route regex to return undefined for modelId to cover the unreachable code path
        const originalExec = Routes.OCCUPATION_BY_ID_ROUTE.exec;
        Routes.OCCUPATION_BY_ID_ROUTE.exec = jest.fn().mockReturnValue([null, undefined, getMockStringId(2)]);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/some-model/occupations/${getMockStringId(2)}`,
          pathParameters: { id: getMockStringId(2) }, // modelId missing
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("modelId is missing in the path");
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS);

        // Restore
        Routes.OCCUPATION_BY_ID_ROUTE.exec = originalExec;
      });

      test("GET /occupations/{id} should respond with BAD_REQUEST if id cannot be extracted from path or pathParameters", async () => {
        // Mock the route regex to return undefined for id to cover the unreachable code path
        const originalExec = Routes.OCCUPATION_BY_ID_ROUTE.exec;
        Routes.OCCUPATION_BY_ID_ROUTE.exec = jest.fn().mockReturnValue([null, getMockStringId(1), undefined]);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${getMockStringId(1)}/occupations/some-id`,
          pathParameters: { modelId: getMockStringId(1) }, // id missing
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("id is missing in the path");
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS);

        // Restore
        Routes.OCCUPATION_BY_ID_ROUTE.exec = originalExec;
      });
    });

    describe("GET /occupations (paginated)", () => {
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

      test("GET should return only the occupations for the given modelId", async () => {
        // AND GIVEN a repository that will successfully get an arbitrary number (N) of models
        const givenOccupations: Array<IOccupation> = [
          {
            ...getIOccupationMockData(1),
            modelId: givenModelId,
            UUID: "foo",
            UUIDHistory: ["foo"],
            importId: null,
          },
          {
            ...getIOccupationMockData(2),
            modelId: givenModelId,
            UUID: "bar",
            UUIDHistory: ["bar"],
            importId: null,
          },
          {
            ...getIOccupationMockData(3),
            modelId: givenModelId,
            UUID: "baz",
            UUIDHistory: ["baz"],
            importId: null,
          },
        ];

        const firstPageOccupations = givenOccupations.slice(-2);

        const limit = 2;
        const firstPageCursor = Buffer.from(
          JSON.stringify({ id: givenOccupations[2].id, createdAt: givenOccupations[2].createdAt })
        ).toString("base64");

        const expectedNextCursor = Buffer.from(
          JSON.stringify({ id: givenOccupations[0].id, createdAt: givenOccupations[0].createdAt })
        ).toString("base64");

        // AND the user is not model manager
        checkRole.mockReturnValueOnce(false);

        // AND a repository that will successfully get the limited occupations
        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(null),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockReturnValue({
            items: firstPageOccupations,
            nextCursor: { _id: givenOccupations[0].id, createdAt: givenOccupations[0].createdAt },
          }),
          encodeCursor: jest.fn().mockReturnValue(expectedNextCursor),
          decodeCursor: jest
            .fn()
            .mockReturnValue({ id: givenOccupations[2].id, createdAt: givenOccupations[2].createdAt }),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };

        jest
          .spyOn(getRepositoryRegistry(), "occupation", "get")
          .mockClear()
          .mockReturnValue(givenOccupationRepositoryMock);

        // WHEN the occupation handler is invoked with the given event and the modelId as path parameter
        const actualResponse = await occupationHandler({
          ...givenEvent,
          queryStringParameters: { limit: limit.toString(), next_cursor: firstPageCursor },
        } as never);

        const expectedFirstPageOccupations = {
          data: firstPageOccupations,
          limit: limit,
          nextCursor: expectedNextCursor,
        };

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the response body contains only the first page Occupations
        expect(JSON.parse(actualResponse.body)).toMatchObject({
          items: expect.arrayContaining(
            expectedFirstPageOccupations.data.map((og) =>
              expect.objectContaining({
                UUID: og.UUID,
                UUIDHistory: og.UUIDHistory,
                code: og.code,
                originUri: og.originUri,
                preferredLabel: og.preferredLabel,
                altLabels: og.altLabels,
                occupationType: og.occupationType,
                description: og.description,
                id: og.id,
                modelId: og.modelId,
                createdAt: og.createdAt.toISOString(),
                updatedAt: og.updatedAt.toISOString(),
                path: `${givenResourcesBaseUrl}/models/${og.modelId}/occupations/${og.id}`,
                tabiyaPath: `${givenResourcesBaseUrl}/models/${og.modelId}/occupations/${og.UUID}`,
              })
            )
          ),
          limit: limit,
          next_cursor: expectedNextCursor,
        });
        // AND the transformation function is called correctly
        expect(transformPaginatedSpy).toHaveBeenCalledWith(
          firstPageOccupations,
          givenResourcesBaseUrl,
          limit,
          expectedNextCursor
        );
      });
      test("GET should respond with the BAD_REQUEST status code if the modelId is not passed as a path parameter", async () => {
        // AND GIVEN the repository fails to get the occupations
        const firstPageCursorObject = {
          id: getMockStringId(1),
          createdAt: new Date(),
        };
        const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(null),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockRejectedValue(new Error("foo")),
          encodeCursor: jest.fn().mockReturnValue(firstPageCursor),
          decodeCursor: jest.fn().mockReturnValue(firstPageCursorObject),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);
        const limit = 2;

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler({
          ...givenBadEvent,
          queryStringParameters: { limit: limit.toString(), next_cursor: firstPageCursor },
        } as never);

        // THEN expect the handler to return the BAD_REQUEST status
        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        // AND the response body contains the error information
        const parsedMissing = JSON.parse(actualResponse.body);
        expect(parsedMissing).toMatchObject({
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "modelId is missing in the path",
        });
        expect(typeof parsedMissing.details).toBe("string");
      });
      test("GET should respond with the BAD_REQUEST status code if the modelId is not correct model id", async () => {
        // AND GIVEN the repository fails to get the occupations
        const firstPageCursorObject = {
          id: getMockStringId(1),
          createdAt: new Date(),
        };
        const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(null),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockRejectedValue(new Error("foo")),
          encodeCursor: jest.fn().mockReturnValue(firstPageCursor),
          decodeCursor: jest.fn().mockReturnValue(firstPageCursorObject),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);
        const limit = 2;

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          pathParameters: { modelId: "foo" },
          queryStringParameters: {},
        };

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler({
          ...givenBadEvent,
          queryStringParameters: { limit: limit.toString(), next_cursor: firstPageCursor },
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
        // AND GIVEN the repository fails to get the occupations
        const firstPageCursorObject = {
          id: getMockStringId(1),
          createdAt: new Date(),
        };
        const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(null),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockRejectedValue(new Error("foo")),
          encodeCursor: jest.fn().mockReturnValue(firstPageCursor),
          decodeCursor: jest.fn().mockReturnValue(firstPageCursorObject),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler({
          ...givenEvent,
          queryStringParameters: { limit: "foo", next_cursor: firstPageCursor },
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

      test("GET /occupations (paginated) should respond with BAD_REQUEST if modelId is missing from path and pathParameters", async () => {
        // Path does NOT include /models/{modelId} at all
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: "/occupations", // ← no modelId segment!
          pathParameters: {}, // modelId missing
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("modelId is missing in the path");
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS);
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if modelId cannot be extracted from path or pathParameters", async () => {
        // Mock the route regex to return undefined for modelId to cover the unreachable code path
        const originalExec = Routes.OCCUPATIONS_ROUTE.exec;
        Routes.OCCUPATIONS_ROUTE.exec = jest.fn().mockReturnValue([null, undefined]);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: "/models/some-model/occupations",
          pathParameters: {}, // modelId missing
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe("modelId is missing in the path");
        expect(body.errorCode).toBe(OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS);

        // Restore
        Routes.OCCUPATIONS_ROUTE.exec = originalExec;
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if query parameters are invalid", async () => {
        const givenModelId = getMockStringId(1);

        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations`,
          pathParameters: { modelId: givenModelId },
          queryStringParameters: { limit: "invalid" },
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe(ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA);
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
      });

      test("GET /occupations (paginated) should respond with BAD_REQUEST if path parameters are invalid", async () => {
        const givenBadEvent = {
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/invalid/occupations`,
          pathParameters: { modelId: "invalid" },
          queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent;

        const actualResponse = await occupationHandler(givenBadEvent);

        expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
        const body = JSON.parse(actualResponse.body);
        expect(body.message).toBe(ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA);
        expect(body.errorCode).toBe(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
      });

      test("GET /occupations (paginated) should extract modelId from path when pathParameters.modelId is not set", async () => {
        // GIVEN a repository that will successfully get an arbitrary number (N) of models
        const givenModelId = getMockStringId(1);
        const givenOccupations: Array<IOccupation> = [
          {
            ...getIOccupationMockData(1),
            modelId: givenModelId,
            UUID: "foo",
            UUIDHistory: ["foo"],
            importId: null,
          },
        ];

        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(null),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockReturnValue({
            items: givenOccupations,
            nextCursor: null,
          }),
          encodeCursor: jest.fn().mockReturnValue(""),
          decodeCursor: jest.fn().mockReturnValue({}),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };

        jest
          .spyOn(getRepositoryRegistry(), "occupation", "get")
          .mockClear()
          .mockReturnValue(givenOccupationRepositoryMock);

        // WHEN the occupation handler is invoked with pathParameters.modelId not set, but path matches regex
        const actualResponse = await occupationHandler({
          httpMethod: HTTP_VERBS.GET,
          headers: {},
          path: `/models/${givenModelId}/occupations`,
          pathParameters: {}, // modelId not set
          queryStringParameters: {},
        } as never);

        // THEN expect the handler to return the OK status
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Type": "application/json",
        });

        // AND the response body contains the occupations
        expect(JSON.parse(actualResponse.body)).toMatchObject({
          items: expect.arrayContaining(
            givenOccupations.map((og) =>
              expect.objectContaining({
                UUID: og.UUID,
                modelId: og.modelId,
              })
            )
          ),
          limit: 100,
          next_cursor: null,
        });
      });

      test("GET should respond with the INTERNAL_SERVER_ERROR status code if the repository fails to get the occupations", async () => {
        // AND GIVEN the repository fails to get the occupations
        const firstPageCursorObject = {
          id: getMockStringId(1),
          createdAt: new Date(),
        };
        const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(null),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockRejectedValue(new Error("foo")),
          encodeCursor: jest.fn().mockReturnValue(firstPageCursor),
          decodeCursor: jest.fn().mockReturnValue(firstPageCursorObject),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);
        const limit = 2;

        // WHEN the occupation handler is invoked with the given event
        const actualResponse = await occupationHandler({
          ...givenEvent,
          queryStringParameters: { limit: limit.toString(), next_cursor: firstPageCursor },
        } as never);

        // THEN expect the handler to call the repository to get the occupations
        expect(getRepositoryRegistry().occupation.findPaginated).toHaveBeenCalled();
        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to retrieve the occupations from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });

      test("GET should respond with the INTERNAL_SERVER_ERROR status code if decodeCursor throws an error", async () => {
        // AND GIVEN the repository decodeCursor throws an error
        const givenOccupationRepositoryMock = {
          Model: undefined as never,
          create: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(null),
          findAll: jest.fn().mockResolvedValue(null),
          findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
          encodeCursor: jest.fn().mockReturnValue(""),
          decodeCursor: jest.fn().mockImplementation(() => {
            throw new Error("Invalid cursor");
          }),
          getOccupationByUUID: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(givenOccupationRepositoryMock);

        // WHEN the occupation handler is invoked with invalid cursor
        const actualResponse = await occupationHandler({
          ...givenEvent,
          queryStringParameters: { next_cursor: "invalid_cursor" },
        } as never);

        // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
        expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        // AND the response body contains the error information
        const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
          errorCode: OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          message: "Failed to retrieve the occupations from the DB",
          details: "",
        };
        expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
      });
      testMethodsNotAllowed(
        [HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH],
        occupationHandler
      );
    });
  });
});
