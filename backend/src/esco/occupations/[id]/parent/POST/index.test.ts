import "_test_utilities/consoleMock";
import * as config from "server/config/config";
import * as transformModule from "esco/occupations/_shared/transform";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler as postOccupationParentHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import * as authenticatorModule from "auth/authorizer";
import { usersRequestContext } from "_test_utilities/dataModel";
import { ObjectTypes } from "esco/common/objectTypes";
import { getIOccupationMockData } from "esco/occupations/_shared/testDataHelper";
import { ModelForOccupationValidationErrorCode } from "esco/occupations/services/occupation.service.types";
import {
  ParentForOccupationValidationErrorCode,
  OccupationParentValidationError,
} from "esco/occupationHierarchy/occupationHierarchy.service.types";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildParentResponse } from "./response";
import "_test_utilities/consoleMock";

let checkRole: jest.SpyInstance;
let transformDynamicEntitySpy: jest.SpyInstance;

// Mock service registry
jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for occupation Parent POST handler", () => {
  let mockServiceRegistry: {
    occupation: {
      validateModelForOccupation: jest.Mock;
    };
    occupationHierarchy: {
      setParent: jest.Mock;
    };
    initialize: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    checkRole = jest.spyOn(authenticatorModule, "checkRole").mockResolvedValue(true);
    transformDynamicEntitySpy = jest.spyOn(transformModule, "transformDynamicEntity");

    mockServiceRegistry = {
      occupation: {
        validateModelForOccupation: jest.fn(),
      },
      occupationHierarchy: {
        setParent: jest.fn(),
      },
      initialize: jest.fn(),
    };
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry as unknown as ServiceRegistry);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
          id: givenParentId,
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);

      const mockParent = getIOccupationMockData(2);
      mockParent.id = givenParentId;
      mockServiceRegistry.occupationHierarchy.setParent.mockResolvedValue(mockParent);

      const actualResponse = await postOccupationParentHandler(givenEvent);

      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      expect(mockServiceRegistry.occupationHierarchy.setParent).toHaveBeenCalledWith(
        givenModelId,
        givenOccupationId,
        givenParentId,
        ObjectTypes.ESCOOccupation
      );
      expect(transformDynamicEntitySpy).toHaveBeenCalledWith(mockParent, givenResourcesBaseUrl);
    });

    test("should respond with BAD_REQUEST when path params are invalid", async () => {
      const givenEvent = {
        httpMethod: "POST",
        path: "/models/invalid-id/occupations/invalid-id/parent",
        pathParameters: { modelId: "invalid-id", id: "invalid-id" },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with BAD_REQUEST when body is empty", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when Content-Type is invalid", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({}),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with BAD_REQUEST when schema validation fails", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "invalid-id",
          objectType: "INVALID_TYPE",
        }),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with TOO_LARGE_PAYLOAD when body is too long", async () => {
      const RouterModelId = () => getMockStringId(1);
      const RouterOccupationId = () => getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${RouterModelId()}/occupations/${RouterOccupationId()}/parent`,
        pathParameters: { modelId: RouterModelId(), id: RouterOccupationId() },
        headers: { "Content-Type": "application/json" },
        body: "a".repeat(OccupationAPISpecs.Constants.MAX_PAYLOAD_LENGTH + 1),
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when body is not valid JSON", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "{",
      } as unknown as APIGatewayProxyEvent;

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test("should respond with NOT_FOUND when model is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(
        ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID
      );

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Parent.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
      });
    });

    test("should respond with INTERNAL_SERVER_ERROR when model validation fails with DB error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(
        ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB
      );

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_PARENT,
      });
    });

    test("should respond with BAD_REQUEST when model is released", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(
        ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED
      );

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Parent.POST.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
      });
    });

    test("should respond with NOT_FOUND when child occupation is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationHierarchy.setParent.mockRejectedValue(
        new OccupationParentValidationError(ParentForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND)
      );

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Parent.POST.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
      });
    });

    test("should respond with NOT_FOUND when parent is not found", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationHierarchy.setParent.mockRejectedValue(
        new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_NOT_FOUND)
      );

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Parent.POST.Errors.Status404.ErrorCodes.PARENT_NOT_FOUND,
      });
    });

    test("should respond with BAD_REQUEST when type validation fails", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationHierarchy.setParent.mockRejectedValue(
        new OccupationParentValidationError(ParentForOccupationValidationErrorCode.INVALID_PARENT_TYPE)
      );

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Parent.POST.Errors.Status400.ErrorCodes.INVALID_PARENT_TYPE,
      });
    });

    test("should respond with BAD_REQUEST when code consistency validation fails", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationHierarchy.setParent.mockRejectedValue(
        new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT)
      );

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode: OccupationAPISpecs.Occupation.Parent.POST.Errors.Status400.ErrorCodes.PARENT_CHILD_CODE_INCONSISTENT,
      });
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationHierarchy.setParent.mockRejectedValue(
        new OccupationParentValidationError(
          ParentForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_PARENT
        )
      );

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_PARENT,
      });
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save (generic error)", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationHierarchy.setParent.mockRejectedValue(new Error("Generic DB error"));

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_PARENT,
      });
    });

    test("should respond with BAD_REQUEST when body is not valid JSON and JSON.parse throws a non-Error", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: "{",
      } as unknown as APIGatewayProxyEvent;

      const parseSpy = jest.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string parse error";
      });

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      parseSpy.mockRestore();
    });

    test("should respond with INTERNAL_SERVER_ERROR when DB error occurs during save (generic non-Error)", async () => {
      const givenModelId = getMockStringId(1);
      const givenOccupationId = getMockStringId(2);
      const givenEvent = {
        httpMethod: "POST",
        path: `/models/${givenModelId}/occupations/${givenOccupationId}/parent`,
        pathParameters: { modelId: givenModelId, id: givenOccupationId },
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: getMockStringId(3),
          objectType: ObjectTypes.ESCOOccupation,
        }),
      } as unknown as APIGatewayProxyEvent;

      mockServiceRegistry.occupation.validateModelForOccupation.mockResolvedValue(null);
      mockServiceRegistry.occupationHierarchy.setParent.mockRejectedValue("string generic DB error");

      const actualResponse = await postOccupationParentHandler(givenEvent);
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body)).toMatchObject({
        errorCode:
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_PARENT,
      });
    });
  });

  describe("Response test", () => {
    test("should return null if parent is null", () => {
      const result = buildParentResponse(null, "https://some/url");
      expect(result).toBeNull();
    });
  });
});
