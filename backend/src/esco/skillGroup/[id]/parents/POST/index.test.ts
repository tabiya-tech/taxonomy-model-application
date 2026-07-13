import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import SkillGroupParentsPOSTAPISpecs from "api-specifications/esco/skillGroup/[id]/parents/POST";
import ErrorAPISpecs from "api-specifications/error";
import * as authenticatorModule from "auth/authorizer";
import * as responseModule from "./response";
import { SkillGroupParentPOSTController, handler } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { ISkillGroupService } from "esco/skillGroup/services/skillGroup.service.type";
import {
  SkillGroupModelValidationError,
  SetSkillGroupParentError,
  SetSkillGroupParentErrorCode,
} from "esco/skillGroup/services/skillGroup.service.type";
import { ModelForSkillGroupValidationErrorCode } from "esco/skillGroup/_shared/skillGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
import { ObjectTypes } from "esco/common/objectTypes";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";
import { getRandomString } from "_test_utilities/getMockRandomData";

jest.mock("server/serviceRegistry/serviceRegistry");
jest.mock("./response");
jest.mock("validator", () => ({
  ajvInstance: {
    getSchema: jest.fn(),
  },
  ParseValidationError: jest.fn().mockReturnValue("validation error"),
}));

const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const mockTransform = jest.mocked(responseModule.transformParent);
const checkRole = jest.spyOn(authenticatorModule, "checkRole");
checkRole.mockResolvedValue(true);

describe("SkillGroupParentPOSTController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  function buildValidEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
    const modelId = getMockStringId(1);
    const id = getMockStringId(2);
    return {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${modelId}/skillGroups/${id}/parents`,
      pathParameters: { modelId, id },
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.REGISTED_USER,
      body: JSON.stringify({
        parentId: getMockStringId(3),
        parentType: ObjectTypes.SkillGroup,
      }),
      ...overrides,
    } as unknown as APIGatewayProxyEvent;
  }

  function givenSkillGroup(id: string, modelId: string) {
    return {
      id,
      modelId,
      code: getTestSkillGroupCode(100),
      UUID: getRandomString(10),
      preferredLabel: getRandomString(10),
      altLabels: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      parents: [],
      UUIDHistory: [],
      children: [],
      originUri: "",
      description: "",
      scopeNote: "",
      importId: "",
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    checkRole.mockResolvedValue(true);
    getResourcesBaseUrlSpy.mockReturnValue("https://resources.example.com");
    getMockGetSchema().mockReturnValue(jest.fn().mockReturnValue(true) as never);

    const mockServiceRegistry = {
      skillGroup: {
        create: jest.fn(),
        setParent: jest.fn(),
        findById: jest.fn(),
        findPaginated: jest.fn(),
        findParents: jest.fn(),
        findChildren: jest.fn(),
        validateModelForSkillGroup: jest.fn(),
        getHistory: jest.fn(),
      } as ISkillGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
  });

  describe("Security tests", () => {
    test("should respond with FORBIDDEN status code if a user is not a model manager", async () => {
      checkRole.mockResolvedValue(false);
      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });
  });

  describe("Route validation tests", () => {
    test("should respond with BAD_REQUEST when route path does not match", async () => {
      const event = buildValidEvent({ path: "/invalid/route", pathParameters: {} });
      const actualResponse = await new SkillGroupParentPOSTController().post(event);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toEqual({
        errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        message: "Route did not match",
        details: "",
      });
    });

    test("should respond with BAD_REQUEST when event path is undefined", async () => {
      const { path: _, ...eventWithoutPath } = buildValidEvent();
      const actualResponse = await new SkillGroupParentPOSTController().post(eventWithoutPath as APIGatewayProxyEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    });

    test("should respond with BAD_REQUEST when path parameters fail ajv validation", async () => {
      getMockGetSchema().mockReturnValue(jest.fn().mockReturnValue(false) as never);
      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    });
  });

  describe("Request body validation tests", () => {
    test("should respond with UNSUPPORTED_MEDIA_TYPE if Content-Type is missing", async () => {
      const event = buildValidEvent({ headers: {} });
      const actualResponse = await new SkillGroupParentPOSTController().post(event);
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE if Content-Type is not application/json", async () => {
      const event = buildValidEvent({ headers: { "Content-Type": "text/html" } });
      const actualResponse = await new SkillGroupParentPOSTController().post(event);
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR);
    });

    test("should respond with BAD_REQUEST if body is null", async () => {
      const event = buildValidEvent({ body: null as unknown as string });
      const actualResponse = await new SkillGroupParentPOSTController().post(event);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST if body is empty string", async () => {
      const event = buildValidEvent({ body: "" });
      const actualResponse = await new SkillGroupParentPOSTController().post(event);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST if body is malformed JSON", async () => {
      const event = buildValidEvent({ body: "{" });
      const actualResponse = await new SkillGroupParentPOSTController().post(event);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY);
    });

    test("should respond with REQUEST_TOO_LONG if body exceeds max payload length", async () => {
      const largeBody = "a".repeat(SkillGroupParentsPOSTAPISpecs.Constants.MAX_POST_PAYLOAD_LENGTH + 1);
      const event = buildValidEvent({ body: largeBody });
      const actualResponse = await new SkillGroupParentPOSTController().post(event);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when JSON.parse throws a non-Error value", async () => {
      jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
        throw "string parse error";
      });
      const event = buildValidEvent();
      const actualResponse = await new SkillGroupParentPOSTController().post(event);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY);
    });

    test("should respond with BAD_REQUEST if request body does not conform to schema", async () => {
      getMockGetSchema().mockImplementation((schemaId: string) => {
        const pathParamSchemaId = SkillGroupAPISpecs.GET.Schemas.Request.Param.Payload.$id;
        return jest.fn().mockReturnValue(schemaId === pathParamSchemaId) as never;
      });

      const event = buildValidEvent({
        body: JSON.stringify({ foo: "bar" }),
      });
      const actualResponse = await new SkillGroupParentPOSTController().post(event);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
  });

  describe("Model validation tests", () => {
    test("should respond with NOT_FOUND when model is not found by ID", async () => {
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup.setParent = jest
        .fn()
        .mockRejectedValue(
          new SkillGroupModelValidationError(ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID)
        );

      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(SkillGroupParentsPOSTAPISpecs.Enums.Status404.ErrorCodes.MODEL_NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB fetch fails", async () => {
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup.setParent = jest
        .fn()
        .mockRejectedValue(
          new SkillGroupModelValidationError(ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB)
        );

      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        SkillGroupParentsPOSTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP_PARENT
      );
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup.setParent = jest
        .fn()
        .mockRejectedValue(new SkillGroupModelValidationError(ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED));

      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(SkillGroupParentsPOSTAPISpecs.Enums.Status400.ErrorCodes.MODEL_IS_RELEASED);
    });

    test("should respond with INTERNAL_SERVER_ERROR for unknown SkillGroupModelValidationError code", async () => {
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup.setParent = jest
        .fn()
        .mockRejectedValue(new SkillGroupModelValidationError(99 as ModelForSkillGroupValidationErrorCode));

      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        SkillGroupParentsPOSTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP_PARENT
      );
    });
  });

  describe("Skill group lookup tests", () => {
    test("should respond with NOT_FOUND when child skill group is not found", async () => {
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup.setParent = jest
        .fn()
        .mockRejectedValue(new SetSkillGroupParentError(SetSkillGroupParentErrorCode.CHILD_NOT_FOUND));

      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(SkillGroupParentsPOSTAPISpecs.Enums.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND);
    });

    test("should respond with NOT_FOUND when parent skill group is not found", async () => {
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup.setParent = jest
        .fn()
        .mockRejectedValue(new SetSkillGroupParentError(SetSkillGroupParentErrorCode.PARENT_NOT_FOUND));

      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(SkillGroupParentsPOSTAPISpecs.Enums.Status404.ErrorCodes.PARENT_NOT_FOUND);
    });

    test("should respond with INTERNAL_SERVER_ERROR for unknown SetSkillGroupParentError code", async () => {
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup.setParent = jest
        .fn()
        .mockRejectedValue(new SetSkillGroupParentError(99 as SetSkillGroupParentErrorCode));

      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        SkillGroupParentsPOSTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP_PARENT
      );
    });
  });

  describe("Success path", () => {
    test("should respond with CREATED status code and transformed parent for valid input", async () => {
      const givenParentId = getMockStringId(3);

      const parentSkillGroup = givenSkillGroup(givenParentId, getMockStringId(1));

      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup.setParent = jest.fn().mockResolvedValue(parentSkillGroup);

      const transformedValue = { id: givenParentId, transformed: true };
      mockTransform.mockReturnValue(transformedValue as never);

      const event = buildValidEvent({
        body: JSON.stringify({
          parentId: givenParentId,
          parentType: ObjectTypes.SkillGroup,
        }),
      });

      const actualResponse = await new SkillGroupParentPOSTController().post(event);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(mockTransform).toHaveBeenCalledWith(parentSkillGroup, "https://resources.example.com");
      expect(JSON.parse(actualResponse.body)).toEqual(transformedValue);
    });
  });

  describe("Handler export", () => {
    test("handler should delegate to the controller post method", async () => {
      const event = buildValidEvent();
      const actualResponse = await handler(event);
      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    });
  });

  describe("Error handling", () => {
    test("should respond with INTERNAL_SERVER_ERROR when setParent throws a generic error", async () => {
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup.setParent = jest.fn().mockRejectedValue(new Error("DB failure"));

      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(actualResponse.body);
      expect(body.errorCode).toEqual(
        SkillGroupParentsPOSTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP_PARENT
      );
    });

    test("should respond with INTERNAL_SERVER_ERROR when a non-Error value is thrown in catch", async () => {
      const mockServiceRegistry = mockGetServiceRegistry();
      mockServiceRegistry.skillGroup.setParent = jest.fn().mockRejectedValue("string error");

      const actualResponse = await new SkillGroupParentPOSTController().post(buildValidEvent());
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});
