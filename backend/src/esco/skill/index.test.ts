import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "./transform";
import { handler as skillHandler, SkillController } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";

import { randomUUID } from "node:crypto";
import ErrorAPISpecs from "api-specifications/error";
import { getRandomString } from "_test_utilities/getMockRandomData";
import SkillAPISpecs from "api-specifications/esco/skill";

import * as authenticatorModule from "auth/authorizer";
import { ISkill, ModelForSkillValidationErrorCode } from "./skills.types";
import { getISkillMockData } from "./testDataHelper";
import { getISkillGroupMockData } from "esco/skillGroup/testDataHelper";
import { ISkillRepository } from "./skillRepository";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { testMethodsNotAllowed } from "_test_utilities/stdRESTHandlerTests";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillService } from "./skillService.type";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

const transformSpy = jest.spyOn(transformModule, "transform");
const transformPaginatedSpy = jest.spyOn(transformModule, "transformPaginated");

interface ITestingSkillController {
  encodeCursor(id: string, createdAt: Date): string;
  decodeCursor(cursor: string): { id: string; createdAt: Date };
}
const transformPaginatedRelationSpy = jest.spyOn(transformModule, "transformPaginatedRelation");
const transformPaginatedOccupationsSpy = jest.spyOn(transformModule, "transformPaginatedOccupations");
const transformPaginatedRelatedSpy = jest.spyOn(transformModule, "transformPaginatedRelated");

// Mock the service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for skill handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("handler should handle undefined event", async () => {
    mockGetServiceRegistry.mockReturnValue({ skill: {} } as unknown as ServiceRegistry);
    const actualResponse = await skillHandler(undefined as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.METHOD_NOT_ALLOWED);
  });

  test("handler should handle null path", async () => {
    mockGetServiceRegistry.mockReturnValue({ skill: {} } as unknown as ServiceRegistry);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: null,
    };
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  describe("GET", () => {
    // GIVEN a valid GET request (method & header)
    const givenModelId = getMockStringId(1);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      pathParameters: { modelId: givenModelId.toString() },
      path: `/models/${givenModelId}/skills`,
    };
    // AND a configured base path for resource
    const givenResourcesBaseUrl = "https://some/path/to/api/resources";
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);

    test("GET should return only the skills for the given modelId", async () => {
      // AND GIVEN a repository that will successfully get an arbitrary number (N) of models
      const givenSkills: Array<ISkill> = [
        {
          ...getISkillMockData(1, givenModelId),
          UUID: randomUUID(),
          UUIDHistory: [randomUUID()],
          importId: randomUUID(),
        },
        {
          ...getISkillMockData(2, givenModelId),
          UUID: randomUUID(),
          UUIDHistory: [randomUUID()],
          importId: randomUUID(),
        },
        {
          ...getISkillMockData(3, givenModelId),
          UUID: randomUUID(),
          UUIDHistory: [randomUUID()],
          importId: randomUUID(),
        },
      ];
      const firstPageSkills = givenSkills.slice(-2);

      const limit = 2;
      const firstPageCursor = Buffer.from(
        JSON.stringify({ id: givenSkills[2].id, createdAt: givenSkills[2].createdAt })
      ).toString("base64");

      const expectedNextCursor = null;

      // AND the user is not model manager
      checkRole.mockResolvedValueOnce(true);

      const givenSkillServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: firstPageSkills, nextCursor: null }),
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService;

      const mockServiceRegistry = {
        skill: givenSkillServiceMock,
      } as unknown as ServiceRegistry;
      mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);

      // WHEN the Skill handler is invoked with the given event and the modelId as path parameter
      const actualResponse = await skillHandler({
        ...givenEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      } as never);

      const expectedFirstPageSkills = {
        data: firstPageSkills,
        limit: limit,
        nextCursor: expectedNextCursor,
      };
      // THEN expect the handler to return the OK status
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the response body contains only the first page Skills
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        ...expectedFirstPageSkills,
        data: expect.arrayContaining(
          expectedFirstPageSkills.data.map((skill) =>
            expect.objectContaining({
              UUID: skill.UUID,
              UUIDHistory: skill.UUIDHistory,
              originUri: skill.originUri,
              preferredLabel: skill.preferredLabel,
              altLabels: skill.altLabels,
              description: skill.description,
              id: skill.id,
              modelId: skill.modelId,
              createdAt: skill.createdAt.toISOString(),
              updatedAt: skill.updatedAt.toISOString(),
              path: `${givenResourcesBaseUrl}/models/${skill.modelId}/skills/${skill.id}`,
              tabiyaPath: `${givenResourcesBaseUrl}/models/${skill.modelId}/skills/${skill.UUID}`,
            })
          )
        ),
      });
      // AND the transformation function is called correctly
      expect(transformPaginatedSpy).toHaveBeenCalledWith(
        firstPageSkills,
        givenResourcesBaseUrl,
        limit,
        expectedNextCursor
      );
    });

    test("GET should return nextCursor when nextCursor is present in the paginated skill result", async () => {
      // GIVEN role check passes for anonymous access
      checkRole.mockResolvedValueOnce(true);

      const limit = 1;
      const givenSkills: Array<ISkill> = [
        {
          ...getISkillMockData(1, givenModelId),
          UUID: randomUUID(),
          UUIDHistory: [randomUUID()],
          importId: randomUUID(),
        },
        {
          ...getISkillMockData(2, givenModelId),
          UUID: randomUUID(),
          UUIDHistory: [randomUUID()],
          importId: randomUUID(),
        },
      ];

      // AND a service that will successfully get the skills (returns 2 items for limit 1)
      const givenSkillServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({
          items: [givenSkills[0]],
          nextCursor: { _id: givenSkills[1].id, createdAt: givenSkills[0].createdAt },
        }),
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService;
      const mockServiceRegistry = {
        skill: givenSkillServiceMock,
      } as unknown as ServiceRegistry;
      mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);

      // WHEN the skill handler is invoked with the given event and limit 1
      const actualResponse = await skillHandler({
        ...givenEvent,
        queryStringParameters: { limit: limit.toString() },
      } as never);

      // THEN expect the handler to return the OK status
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });

      // verify the service was called correctly
      expect(getServiceRegistry().skill.findPaginated).toHaveBeenCalledWith(givenModelId, undefined, limit);
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
        [givenSkills[0]],
        givenResourcesBaseUrl,
        limit,
        responseBody.nextCursor
      );
    });

    test("GET should respond with the BAD_REQUEST status code if the modelId is not passed as a path parameter", async () => {
      // AND GIVEN the repository fails to get the skills
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
        path: "/models/skills",
      };
      // AND the user is not model manager
      checkRole.mockResolvedValueOnce(true);

      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler({
        ...givenBadEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      } as never);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const parsedMissing = JSON.parse(actualResponse.body);
      expect(parsedMissing).toMatchObject({
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: "modelId is missing in the path",
      });
      expect(typeof parsedMissing.details).toBe("string");
    });

    test("GET should respond with the BAD_REQUEST status code if the modelId is not correct model id", async () => {
      // AND GIVEN the repository fails to get the skills
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
        path: "/models/foo/skills",
      };

      // AND the user is not model manager
      checkRole.mockResolvedValueOnce(true);

      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler({
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
      // GIVEN the repository fails to get the skills
      const firstPageCursorObject = {
        id: getMockStringId(1),
        createdAt: new Date(),
      };
      const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

      // AND the user is not model manager
      checkRole.mockResolvedValueOnce(true);

      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler({
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

    test("GET should respond with the BAD_REQUEST if the cursor decoding failed", async () => {
      // GIVEN a service that model does not exists
      const givenSkillServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn(),
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService;
      const mockServiceRegistry = {
        skill: givenSkillServiceMock,
      } as unknown as ServiceRegistry;
      mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
      checkRole.mockResolvedValueOnce(true);
      const cursor = Buffer.from(getRandomString(10)).toString("base64");
      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler({
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

    test("GET should respond with the INTERNAL_SERVER_ERROR status code if the repository fails to get the skills", async () => {
      // AND GIVEN the repository fails to get the skills
      const firstPageCursorObject = {
        id: getMockStringId(1),
        createdAt: new Date(),
      };
      const firstPageCursor = Buffer.from(JSON.stringify(firstPageCursorObject)).toString("base64");

      const givenSkillRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockRejectedValue(new Error("foo")),
        findParents: jest.fn(),
        findChildren: jest.fn(),
        findOccupationsForSkill: jest.fn(),
        findRelatedSkills: jest.fn(),
      } as unknown as ISkillRepository;
      jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(givenSkillRepositoryMock);
      const limit = 2;

      // AND the user is not model manager
      checkRole.mockResolvedValueOnce(true);

      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler({
        ...givenEvent,
        queryStringParameters: { limit: limit.toString(), cursor: firstPageCursor },
      } as never);

      // THEN expect the handler to return the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillAPISpecs.Enums.GET.List.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILLS,
        message: "Failed to retrieve the skills from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("GET should respond with the OK status code if the queryStringParameters is null", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString() },
        path: `/models/${givenModelId}/skills`,
        queryStringParameters: null,
      };

      const givenSkillServiceMock = {
        findById: jest.fn(),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();

      // WHEN the skill handler is invoked
      const actualResponse = await skillController.getSkills(givenEvent as unknown as APIGatewayProxyEvent);

      // THEN expect OK status
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    });

    test("GET should handle missing path and failed regex match", async () => {
      const givenSkillServiceMock = {
        findPaginated: jest.fn(),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
      const skillController = new SkillController();
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: undefined,
        path: undefined,
      };
      const actualResponse = await skillController.getSkills(givenEvent as unknown as APIGatewayProxyEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("GET should handle path not matching regex", async () => {
      const givenSkillServiceMock = {
        findPaginated: jest.fn(),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
      const skillController = new SkillController();
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: undefined,
        path: "/some/other/path",
      };
      const actualResponse = await skillController.getSkills(givenEvent as unknown as APIGatewayProxyEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("GET should handle falsy path and missing params", async () => {
      const givenSkillServiceMock = {
        findPaginated: jest.fn(),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
      const skillController = new SkillController();
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: undefined,
        path: "",
      };
      const actualResponse = await skillController.getSkills(givenEvent as unknown as APIGatewayProxyEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("GET should cover remaining branches for getSkills", async () => {
      const givenSkillServiceMock = {
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkill: jest.fn().mockResolvedValue(null),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
      const skillController = new SkillController();

      // modelId from regex, path matches
      await skillController.getSkills({
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${getMockStringId(1)}/skills`,
        pathParameters: {},
      } as unknown as APIGatewayProxyEvent);

      // modelId from params, but path is falsy
      await skillController.getSkills({
        httpMethod: HTTP_VERBS.GET,
        path: "",
        pathParameters: { modelId: getMockStringId(1) },
      } as unknown as APIGatewayProxyEvent);
    });

    test("GET should respond with INTERNAL_SERVER_ERROR if getSkills catches a non-Error exception", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString() },
        path: `/models/${givenModelId}/skills`,
      };

      const givenSkillServiceMock = {
        findPaginated: jest.fn().mockRejectedValue("non-error exception"),
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();

      // WHEN the skill handler is invoked
      const actualResponse = await skillController.getSkills(givenEvent as unknown as APIGatewayProxyEvent);

      // THEN expect INTERNAL_SERVER_ERROR
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    testMethodsNotAllowed(
      [HTTP_VERBS.POST, HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH],
      skillHandler
    );
  });

  describe("GET individual skill", () => {
    test("GET /models/{modelId}/skills/{id} should return the skill for a valid ID", async () => {
      // GIVEN a valid request with modelId and skill ID
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skills/${givenSkillId}`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      // AND a configured base path for resource
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND a repository that will successfully get the skill
      const givenSkill: ISkill = {
        ...getISkillMockData(1, givenModelId),
        id: givenSkillId,
        UUID: "test-uuid",
        UUIDHistory: ["test-uuid"],
        importId: randomUUID(),
      };

      const givenSkillServiceMock = {
        findById: jest.fn().mockResolvedValue(givenSkill),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService;
      const mockServiceRegistry = {
        skill: givenSkillServiceMock,
      } as unknown as ServiceRegistry;
      mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);

      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler(givenEvent);

      // THEN respond with the OK status code
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the transformation function is called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(givenSkill, givenResourcesBaseUrl);
      // AND the handler to return the expected result
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
    });

    test("GET /models/{modelId}/skills/{id} should response with BAD_REQUEST if the path validation failed ", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: "foo", id: givenSkillId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModelId}/skills/${givenSkillId}`,
      } as never;
      // AND User has the required role
      checkRole.mockResolvedValue(true);
      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler(givenEvent);

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

    test("GET /models/{modelId}/skills/{id} should respond with BAD_REQUEST if modelId and id parsed from path are invalid", async () => {
      // GIVEN an event where pathParameters are missing, so the IDs are parsed from the path via pathToRegexp
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
        path: `/models/invalid-model-id/skills/invalid-skill-id`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler(givenEvent);

      // THEN respond with the BAD_REQUEST status due to JSON schema validation failure
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);

      const parsed = JSON.parse(actualResponse.body);
      expect(parsed).toMatchObject({
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      });
      expect(typeof parsed.details).toBe("string");
    });

    test("GET /models/{modelId}/skills/{id} should respond with NOT_FOUND if skill is not found", async () => {
      // GIVEN a valid request with modelId and skill ID
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: randomUUID(),
        UUIDHistory: [randomUUID()],
        released: false,
      };
      const givenSkillId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModel.id.toString(), id: givenSkillId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModel.id}/skills/${givenSkillId}`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      const givenSkillServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService;
      const mockServiceRegistry = {
        skill: givenSkillServiceMock,
      } as unknown as ServiceRegistry;
      mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);

      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler(givenEvent);
      // THEN respond with the NOT_FOUND status
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillAPISpecs.Enums.GET.ById.Response.Status404.ErrorCodes.SKILL_NOT_FOUND,
        message: "skill not found",
        details: `No skill found with id: ${givenSkillId}`,
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("GET /models/{modelId}/skills/{id} should respond with BAD_REQUEST if modelId is missing", async () => {
      const givenSkillId = getMockStringId(2);

      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { id: givenSkillId.toString() },
        queryStringParameters: {},
        path: `/models//skills/${givenSkillId}`,
      } as never;

      // AND role check passes for anonymous access
      checkRole.mockResolvedValueOnce(true);

      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler(givenEvent as never);

      // THEN expect the handler to return the BAD_REQUEST status
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      // AND the response body contains the error information
      const parsedMissing = JSON.parse(actualResponse.body);
      expect(parsedMissing).toMatchObject({
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: "modelId is missing in the path",
      });
      expect(typeof parsedMissing.details).toBe("string");
    });

    test("GET /models/{modelId}/skills/{id} should respond with INTERNAL_SERVER_ERROR if repository throws an error", async () => {
      // GIVEN a valid request with modelId and skill ID
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(1),
        UUID: randomUUID(),
        UUIDHistory: [randomUUID()],
        released: false,
      };
      const givenSkillId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModel.id.toString(), id: givenSkillId.toString() },
        queryStringParameters: {},
        path: `/models/${givenModel.id}/skills/${givenSkillId}`,
      } as never;

      // AND User has the required role
      checkRole.mockResolvedValue(true);

      // AND a repository that will throw an error
      const givenSkillRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockRejectedValue(new Error("Database connection failed")),
        findAll: jest.fn().mockResolvedValue(null),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        findParents: jest.fn(),
        findChildren: jest.fn(),
        findOccupationsForSkill: jest.fn(),
        findRelatedSkills: jest.fn(),
      } as unknown as ISkillRepository;
      jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(givenSkillRepositoryMock);

      const givenSkillServiceMock = {
        findById: jest.fn().mockRejectedValue(new Error("foo")),
        findPaginated: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService;
      const mockServiceRegistry = {
        skill: givenSkillServiceMock,
      } as unknown as ServiceRegistry;
      mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);

      // WHEN the skill handler is invoked with the given event
      const actualResponse = await skillHandler(givenEvent);

      // THEN respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: SkillAPISpecs.Enums.GET.ById.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL,
        message: "Failed to retrieve the skill from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("GET /models/{modelId}/skills/{id} should respond with INTERNAL_SERVER_ERROR if getSkill catches a non-Error exception", async () => {
      // GIVEN a valid request
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: { modelId: givenModelId.toString(), id: givenSkillId.toString() },
        path: `/models/${givenModelId}/skills/${givenSkillId}`,
      };

      const givenSkillServiceMock = {
        findById: jest.fn().mockRejectedValue("non-error exception"),
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();

      // WHEN the skill handler is invoked
      const actualResponse = await skillController.getSkill(givenEvent as unknown as APIGatewayProxyEvent);

      // THEN expect INTERNAL_SERVER_ERROR
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    test("GET /models/{modelId}/skills/{id} should handle missing pathParameters and fallback to regex", async () => {
      // GIVEN an event with missing pathParameters
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: undefined,
        path: `/models/${givenModelId}/skills/${givenSkillId}`,
      };

      const givenSkillServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        validateModelForSkill: jest.fn(),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();

      // WHEN the skill handler is invoked
      const actualResponse = await skillController.getSkill(givenEvent as unknown as APIGatewayProxyEvent);

      // THEN expect NOT_FOUND (it should find it via regex but findById returns null)
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    test("GET /models/{modelId}/skills/{id} should handle missing path and pathParameters", async () => {
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {},
        pathParameters: undefined,
        path: undefined,
      };

      const givenSkillServiceMock = {
        findById: jest.fn(),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();
      const actualResponse = await skillController.getSkill(givenEvent as unknown as APIGatewayProxyEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("GET /models/{modelId}/skills/{id} should cover remaining branches", async () => {
      const givenSkillServiceMock = {
        findById: jest.fn().mockResolvedValue(null),
        validateModelForSkill: jest.fn().mockResolvedValue(null),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
      const skillController = new SkillController();

      // execMatch is truthy, but params are missing
      await skillController.getSkill({
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}`,
        pathParameters: {},
      } as unknown as APIGatewayProxyEvent);

      // execMatch is falsy, params are missing
      await skillController.getSkill({
        httpMethod: HTTP_VERBS.GET,
        path: "/invalid/path",
        pathParameters: undefined,
      } as unknown as APIGatewayProxyEvent);

      // modelId is from params, but id is from regex
      await skillController.getSkill({
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}`,
        pathParameters: { modelId: getMockStringId(1) },
      } as unknown as APIGatewayProxyEvent);

      // id is from params, but modelId is from regex
      await skillController.getSkill({
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}`,
        pathParameters: { id: getMockStringId(2) },
      } as unknown as APIGatewayProxyEvent);
    });
  });

  describe("SkillController relations", () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);
    const givenResourcesBaseUrl = "https://some/path/to/api/resources";

    beforeEach(() => {
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);
    });

    test("getParents should return 200 and parents", async () => {
      // GIVEN parents from service
      const parents = [getISkillMockData(), getISkillGroupMockData()];
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getParents: jest.fn().mockResolvedValue({ items: parents, nextCursor: null }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenSkillServiceMock.getParents).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        undefined
      );
      expect(transformPaginatedRelationSpy).toHaveBeenCalledWith(
        parents,
        givenResourcesBaseUrl,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        null
      );
    });

    test("getParents should return 400 if route did not match", async () => {
      const event = {
        path: "/invalid/path",
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).message).toEqual("Route did not match");
    });

    test("getParents should return 400 if path is missing (branch coverage)", async () => {
      const event = {
        path: undefined,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).message).toEqual("Route did not match");
    });

    test("getParents should return 400 if path params are invalid", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/invalid-uuid/skills/${givenSkillId}/parents`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    });

    test("getParents should return 500 if service fails", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getParents: jest.fn().mockRejectedValue(new Error("foo")),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Parents.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_PARENTS
      );
    });

    test("getParents should return 404 if model not found", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Parents.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND
      );
    });

    test("getParents should return 500 if validateModelForSkill fails to fetch from DB", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Parents.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_PARENTS
      );
    });

    test("getParents should return 400 if query params are invalid", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
        queryStringParameters: { limit: "invalid" },
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER
      );
    });

    test("getParents should return 400 if cursor is malformed", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
        queryStringParameters: { cursor: "malformed" },
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER
      );
    });

    test("getParents should return 404 if skill not found", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue(null),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Parents.GET.Response.Status404.ErrorCodes.SKILL_NOT_FOUND
      );
    });

    test("getParents should return 200 and nextCursor when provided by service", async () => {
      // GIVEN parents from service with nextCursor info
      const parents = [getISkillMockData()];
      const givenNextCursor = { _id: getMockStringId(3), createdAt: new Date() };
      const encodedCursor = "encoded-cursor";
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getParents: jest.fn().mockResolvedValue({ items: parents, nextCursor: givenNextCursor }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();
      const encodeCursorSpy = jest
        .spyOn(skillController as unknown as ITestingSkillController, "encodeCursor")
        .mockReturnValue(encodedCursor);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
        queryStringParameters: { limit: "5" },
      };

      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(encodeCursorSpy).toHaveBeenCalledWith(givenNextCursor._id, givenNextCursor.createdAt);
      expect(transformPaginatedRelationSpy).toHaveBeenCalledWith(parents, givenResourcesBaseUrl, 5, encodedCursor);
    });

    test("getParents should return 200 and parents when no limit is provided", async () => {
      // GIVEN parents from service
      const parents = [getISkillMockData()];
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getParents: jest.fn().mockResolvedValue({ items: parents, nextCursor: null }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenSkillServiceMock.getParents).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        undefined
      );
    });

    test("getParents should return 200 and parents when valid cursor is provided", async () => {
      // GIVEN parents from service
      const parents = [getISkillMockData()];
      const givenCursor = "some-cursor";
      const decodedCursor = { id: getMockStringId(10), createdAt: new Date() };
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getParents: jest.fn().mockResolvedValue({ items: parents, nextCursor: null }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();
      const decodeCursorSpy = jest
        .spyOn(skillController as unknown as ITestingSkillController, "decodeCursor")
        .mockReturnValue(decodedCursor);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
        queryStringParameters: { cursor: givenCursor },
      };

      const actualResponse = await skillController.getParents(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(decodeCursorSpy).toHaveBeenCalledWith(givenCursor);
      expect(givenSkillServiceMock.getParents).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        decodedCursor.id
      );
    });

    test("getChildren should return 200 and children", async () => {
      // GIVEN children from service
      const children = [getISkillMockData(), getISkillGroupMockData()];
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getChildren: jest.fn().mockResolvedValue({ items: children, nextCursor: null }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/children`,
        queryStringParameters: { limit: "7" },
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenSkillServiceMock.getChildren).toHaveBeenCalledWith(givenModelId, givenSkillId, 7, undefined);
      expect(transformPaginatedRelationSpy).toHaveBeenCalledWith(children, givenResourcesBaseUrl, 7, null);
    });

    test("getChildren should return 200 and children when no limit is provided", async () => {
      // GIVEN children from service
      const children = [getISkillMockData()];
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getChildren: jest.fn().mockResolvedValue({ items: children, nextCursor: null }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/children`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenSkillServiceMock.getChildren).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        undefined
      );
    });

    test("getChildren should return 400 if route did not match", async () => {
      const event = {
        path: "/invalid/path",
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).message).toEqual("Route did not match");
    });

    test("getChildren should return 400 if path is missing (branch coverage)", async () => {
      const event = {
        path: undefined,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).message).toEqual("Route did not match");
    });

    test("getChildren should return 400 if path params are invalid", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/invalid-uuid/skills/${givenSkillId}/children`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    });

    test("getChildren should return 500 if service fails", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getChildren: jest.fn().mockRejectedValue(new Error("foo")),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/children`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Children.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_CHILDREN
      );
    });

    test("getChildren should return 404 if model not found", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/children`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Children.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND
      );
    });

    test("getChildren should return 500 if validateModelForSkill fails to fetch from DB", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/children`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Children.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_CHILDREN
      );
    });

    test("getChildren should return 400 if query params are invalid", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/children`,
        queryStringParameters: { limit: "invalid" },
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER
      );
    });

    test("getChildren should return 400 if cursor is malformed", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/children`,
        queryStringParameters: { cursor: "malformed" },
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER
      );
    });

    test("getChildren should return 404 if skill not found", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue(null),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/children`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Children.GET.Response.Status404.ErrorCodes.SKILL_NOT_FOUND
      );
    });

    test("getChildren should return 200 and nextCursor when provided by service", async () => {
      // GIVEN children from service with nextCursor info
      const children = [getISkillMockData()];
      const givenNextCursor = { _id: getMockStringId(3), createdAt: new Date() };
      const encodedCursor = "encoded-cursor";
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getChildren: jest.fn().mockResolvedValue({ items: children, nextCursor: givenNextCursor }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();
      const encodeCursorSpy = jest
        .spyOn(skillController as unknown as ITestingSkillController, "encodeCursor")
        .mockReturnValue(encodedCursor);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/children`,
      };

      const actualResponse = await skillController.getChildren(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(encodeCursorSpy).toHaveBeenCalledWith(givenNextCursor._id, givenNextCursor.createdAt);
      expect(transformPaginatedRelationSpy).toHaveBeenCalledWith(
        children,
        givenResourcesBaseUrl,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        encodedCursor
      );
    });

    test("getOccupations should return 200 and occupations", async () => {
      // GIVEN occupations from service
      const occupations = [{ id: getMockStringId(5) }];
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getOccupations: jest.fn().mockResolvedValue({ items: occupations, nextCursor: null }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenSkillServiceMock.getOccupations).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        undefined
      );
      expect(transformPaginatedOccupationsSpy).toHaveBeenCalledWith(
        occupations,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        null
      );
    });

    test("getOccupations should return 400 if route did not match", async () => {
      const event = {
        path: "/invalid/path",
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).message).toEqual("Route did not match");
    });

    test("getOccupations should return 400 if path is missing (branch coverage)", async () => {
      const event = {
        path: undefined,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).message).toEqual("Route did not match");
    });

    test("getOccupations should return 500 if service fails", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getOccupations: jest.fn().mockRejectedValue(new Error("foo")),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Occupations.GET.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_SKILL_OCCUPATIONS
      );
    });

    test("getOccupations should return 400 if path params are invalid", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/invalid-uuid/skills/${givenSkillId}/occupations`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    });

    test("getOccupations should return 404 if model not found", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Occupations.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND
      );
    });

    test("getOccupations should return 500 if validateModelForSkill fails to fetch from DB", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Occupations.GET.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_SKILL_OCCUPATIONS
      );
    });

    test("getOccupations should return 400 if query params are invalid", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        queryStringParameters: { limit: "invalid" },
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER
      );
    });

    test("getOccupations should return 400 if cursor is malformed", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        queryStringParameters: { cursor: "malformed" },
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER
      );
    });

    test("getOccupations should return 404 if skill not found", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue(null),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Occupations.GET.Response.Status404.ErrorCodes.SKILL_NOT_FOUND
      );
    });

    test("getOccupations should return 200 and nextCursor when provided by service", async () => {
      // GIVEN occupations from service with nextCursor info
      const occupations = [{ id: getMockStringId(5) }];
      const givenNextCursor = { _id: getMockStringId(3), createdAt: new Date() };
      const encodedCursor = "encoded-cursor";
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getOccupations: jest.fn().mockResolvedValue({ items: occupations, nextCursor: givenNextCursor }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();
      const encodeCursorSpy = jest
        .spyOn(skillController as unknown as ITestingSkillController, "encodeCursor")
        .mockReturnValue(encodedCursor);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        queryStringParameters: { limit: "8" },
      };

      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(encodeCursorSpy).toHaveBeenCalledWith(givenNextCursor._id, givenNextCursor.createdAt);
      expect(transformPaginatedOccupationsSpy).toHaveBeenCalledWith(occupations, 8, encodedCursor);
    });

    test("getOccupations should return 200 and occupations when valid cursor is provided", async () => {
      // GIVEN occupations from service
      const occupations = [{ id: getMockStringId(5) }];
      const givenCursor = "some-cursor";
      const decodedCursor = { id: getMockStringId(10), createdAt: new Date() };
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getOccupations: jest.fn().mockResolvedValue({ items: occupations, nextCursor: null }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();
      const decodeCursorSpy = jest
        .spyOn(skillController as unknown as ITestingSkillController, "decodeCursor")
        .mockReturnValue(decodedCursor);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
        queryStringParameters: { cursor: givenCursor },
      };

      const actualResponse = await skillController.getOccupations(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(decodeCursorSpy).toHaveBeenCalledWith(givenCursor);
      expect(givenSkillServiceMock.getOccupations).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        decodedCursor.id
      );
    });

    test("getRelatedSkills should return 200 and related skills", async () => {
      // GIVEN related skills from service
      const related = [{ id: getMockStringId(6) }];
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getRelatedSkills: jest.fn().mockResolvedValue({ items: related, nextCursor: null }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenSkillServiceMock.getRelatedSkills).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        undefined
      );
      expect(transformPaginatedRelatedSpy).toHaveBeenCalledWith(related, SkillAPISpecs.Constants.DEFAULT_LIMIT, null);
    });

    test("getRelatedSkills should return 400 if route did not match", async () => {
      const event = {
        path: "/invalid/path",
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).message).toEqual("Route did not match");
    });

    test("getRelatedSkills should return 400 if path is missing (branch coverage)", async () => {
      const event = {
        path: undefined,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).message).toEqual("Route did not match");
    });

    test("getRelatedSkills should return 500 if service fails", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getRelatedSkills: jest.fn().mockRejectedValue(new Error("foo")),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Related.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_RELATED_SKILLS
      );
    });

    test("getRelatedSkills should return 400 if path params are invalid", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/invalid-uuid/skills/${givenSkillId}/related`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    });

    test("getRelatedSkills should return 404 if model not found", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Related.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND
      );
    });

    test("getRelatedSkills should return 500 if validateModelForSkill fails to fetch from DB", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Related.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_RELATED_SKILLS
      );
    });

    test("getRelatedSkills should return 400 if query params are invalid", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        queryStringParameters: { limit: "invalid" },
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER
      );
    });

    test("getRelatedSkills should return 400 if cursor is malformed", async () => {
      mockGetServiceRegistry.mockReturnValue({
        skill: { validateModelForSkill: jest.fn().mockResolvedValue(null) },
      } as unknown as ServiceRegistry);
      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        queryStringParameters: { cursor: "malformed" },
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER
      );
    });

    test("getRelatedSkills should return 404 if skill not found", async () => {
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue(null),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
      };

      const skillController = new SkillController();
      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        SkillAPISpecs.Enums.Relations.Related.GET.Response.Status404.ErrorCodes.SKILL_NOT_FOUND
      );
    });

    test("getRelatedSkills should return 200 and nextCursor when provided by service", async () => {
      // GIVEN related skills from service with nextCursor info
      const related = [{ id: getMockStringId(6) }];
      const givenNextCursor = { _id: getMockStringId(3), createdAt: new Date() };
      const encodedCursor = "encoded-cursor";
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getRelatedSkills: jest.fn().mockResolvedValue({ items: related, nextCursor: givenNextCursor }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();
      const encodeCursorSpy = jest
        .spyOn(skillController as unknown as ITestingSkillController, "encodeCursor")
        .mockReturnValue(encodedCursor);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        queryStringParameters: { limit: "9" },
      };

      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(encodeCursorSpy).toHaveBeenCalledWith(givenNextCursor._id, givenNextCursor.createdAt);
      expect(transformPaginatedRelatedSpy).toHaveBeenCalledWith(related, 9, encodedCursor);
    });

    test("getRelatedSkills should return 200 and related skills when valid cursor is provided", async () => {
      // GIVEN related skills from service
      const related = [{ id: getMockStringId(6) }];
      const givenCursor = "some-cursor";
      const decodedCursor = { id: getMockStringId(10), createdAt: new Date() };
      const givenSkillServiceMock = {
        validateModelForSkill: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
        getRelatedSkills: jest.fn().mockResolvedValue({ items: related, nextCursor: null }),
      } as unknown as ISkillService;
      mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

      const skillController = new SkillController();
      const decodeCursorSpy = jest
        .spyOn(skillController as unknown as ITestingSkillController, "decodeCursor")
        .mockReturnValue(decodedCursor);

      const event = {
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
        queryStringParameters: { cursor: givenCursor },
      };

      const actualResponse = await skillController.getRelatedSkills(event as unknown as APIGatewayProxyEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(decodeCursorSpy).toHaveBeenCalledWith(givenCursor);
      expect(givenSkillServiceMock.getRelatedSkills).toHaveBeenCalledWith(
        givenModelId,
        givenSkillId,
        SkillAPISpecs.Constants.DEFAULT_LIMIT,
        decodedCursor.id
      );
    });
  });

  describe("handler routing", () => {
    const givenModelId = getMockStringId(1);
    const givenSkillId = getMockStringId(2);

    test("handler should route parents correctly", async () => {
      const getParentsSpy = jest.spyOn(SkillController.prototype, "getParents").mockResolvedValue({
        statusCode: StatusCodes.OK,
        body: "",
      } as APIGatewayProxyResult);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${givenModelId}/skills/${givenSkillId}/parents`,
      };
      await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
      expect(getParentsSpy).toHaveBeenCalled();
      getParentsSpy.mockRestore();
    });

    test("handler should route children correctly", async () => {
      const getChildrenSpy = jest.spyOn(SkillController.prototype, "getChildren").mockResolvedValue({
        statusCode: StatusCodes.OK,
        body: "",
      } as APIGatewayProxyResult);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${givenModelId}/skills/${givenSkillId}/children`,
      };
      await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
      expect(getChildrenSpy).toHaveBeenCalled();
      getChildrenSpy.mockRestore();
    });

    test("handler should route occupations correctly", async () => {
      const getOccupationsSpy = jest.spyOn(SkillController.prototype, "getOccupations").mockResolvedValue({
        statusCode: StatusCodes.OK,
        body: "",
      } as APIGatewayProxyResult);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
      };
      await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
      expect(getOccupationsSpy).toHaveBeenCalled();
      getOccupationsSpy.mockRestore();
    });

    test("handler should route related skills correctly", async () => {
      const getRelatedSkillsSpy = jest.spyOn(SkillController.prototype, "getRelatedSkills").mockResolvedValue({
        statusCode: StatusCodes.OK,
        body: "",
      } as APIGatewayProxyResult);
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${givenModelId}/skills/${givenSkillId}/related`,
      };
      await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
      expect(getRelatedSkillsSpy).toHaveBeenCalled();
      getRelatedSkillsSpy.mockRestore();
    });
  });
});
