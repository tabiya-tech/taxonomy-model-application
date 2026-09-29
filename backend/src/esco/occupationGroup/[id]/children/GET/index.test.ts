import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import * as queryModule from "./query";
import * as responseModule from "./response";
import { handler as OccupationGroupChildrenHandler } from "./index";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { IOccupationGroupService } from "../../../services/occupationGroup.service.type";
import { ModelForOccupationGroupValidationErrorCode } from "../../../_shared/OccupationGroup.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import * as config from "server/config/config";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import LanguageAPISpecs from "api-specifications/language";
import { getMockStringId } from "_test_utilities/mockMongoId";

jest.mock("server/serviceRegistry/serviceRegistry");
jest.mock("./query");
jest.mock("./response");
jest.mock("validator", () => ({
  ajvInstance: {
    getSchema: jest.fn(),
  },
}));

const mockGetServiceRegistry = jest.mocked(getServiceRegistry);
const mockGetOccupationGroupChildrenPathParameters = jest.mocked(queryModule.getOccupationGroupChildrenPathParameters);
const mockTransformPaginatedChildren = jest.mocked(responseModule.transformPaginatedChildren);

describe("OccupationGroupChildrenController", () => {
  const getResourcesBaseUrlSpy = jest.spyOn(config, "getResourcesBaseUrl");

  function getMockGetSchema() {
    return jest.requireMock("validator").ajvInstance.getSchema as jest.Mock;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    const mockServiceRegistry = {
      occupationGroup: {
        create: jest.fn(),
        findById: jest.fn(),
        findParent: jest.fn(),
        findPaginated: jest.fn(),
        searchPaginated: jest.fn(),
        validateModelForOccupationGroup: jest.fn(),
        findChildren: jest.fn(),
        setParent: jest.fn(),
        getHistory: jest.fn(),
        update: jest.fn(),
        patch: jest.fn(),
      } as IOccupationGroupService,
    } as unknown as ServiceRegistry;
    mockGetServiceRegistry.mockReturnValue(mockServiceRegistry);
    getResourcesBaseUrlSpy.mockReturnValue("https://resources.example.com");
  });

  function buildEvent(path: string): APIGatewayProxyEvent {
    return {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      path,
      pathParameters: {
        modelId: "model-1",
        id: "group-1",
      },
      queryStringParameters: {},
      requestContext: usersRequestContext.REGISTED_USER,
    } as never;
  }

  test("returns the children occupation groups when the model and children exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupChildrenPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);
    mockTransformPaginatedChildren.mockReturnValue({ data: [], limit: null, nextCursor: null } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: null, availableLanguages: [] });
    mockServiceRegistry.occupationGroup.findChildren = jest.fn().mockResolvedValue([]);

    const actualResponse = await OccupationGroupChildrenHandler(
      buildEvent("/models/model-1/occupationGroups/group-1/children")
    );

    expect(mockGetOccupationGroupChildrenPathParameters).toHaveBeenCalledWith(
      "/models/model-1/occupationGroups/group-1/children"
    );
    expect(mockServiceRegistry.occupationGroup.validateModelForOccupationGroup).toHaveBeenCalledWith("model-1");
    expect(mockServiceRegistry.occupationGroup.findChildren).toHaveBeenCalledWith("group-1", "en");
    expect(mockTransformPaginatedChildren).toHaveBeenCalledWith([], "https://resources.example.com", null, null);
    expect(actualResponse.statusCode).toBe(StatusCodes.OK);
  });

  test("returns BAD_REQUEST when the route parameters fail validation", async () => {
    const validatePathFunction = Object.assign(jest.fn().mockReturnValue(false), {
      errors: [{ instancePath: "/id", message: "invalid id" }],
    });
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupChildrenPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const actualResponse = await OccupationGroupChildrenHandler(
      buildEvent("/models/model-1/occupationGroups/group-1/children")
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      message: ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
    });
  });

  test("returns NOT_FOUND when the model does not exist", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupChildrenPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID });

    const actualResponse = await OccupationGroupChildrenHandler(
      buildEvent("/models/model-1/occupationGroups/group-1/children")
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Model not found",
    });
  });

  test("returns INTERNAL_SERVER_ERROR when validation against the model fails", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupChildrenPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.validateModelForOccupationGroup = jest
      .fn()
      .mockResolvedValue({ errorCode: ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB });

    const actualResponse = await OccupationGroupChildrenHandler(
      buildEvent("/models/model-1/occupationGroups/group-1/children")
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body)).toMatchObject({
      message: "Failed to fetch the model details from the DB",
    });
  });
  test("returns INTERNAL_SERVER_ERROR if repository fails to fetch data", async () => {
    const validatePathFunction = jest.fn().mockReturnValue(true);
    getMockGetSchema().mockReturnValue(validatePathFunction as never);
    mockGetOccupationGroupChildrenPathParameters.mockReturnValue({ modelId: "model-1", id: "group-1" } as never);

    const mockServiceRegistry = mockGetServiceRegistry();
    mockServiceRegistry.occupationGroup.findChildren = jest.fn().mockRejectedValue(new Error("DB error"));

    const actualResponse = await OccupationGroupChildrenHandler(
      buildEvent("/models/model-1/occupationGroups/group-1/children")
    );

    expect(actualResponse.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.Children.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_CHILDREN,
      message: "Failed to retrieve the occupation group children from the DB",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  describe("language negotiation", () => {
    const givenModelId = getMockStringId(1);
    const givenId = getMockStringId(2);
    const FALLBACK_LANG = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE;
    const SECONDARY_LANG = LanguageAPISpecs.Constants.Languages[1]; // French
    const givenAvailableLanguages = [FALLBACK_LANG.shortCode, SECONDARY_LANG.shortCode];

    function buildEvent(headers?: Record<string, string>): APIGatewayProxyEvent {
      const validatePathFunction = jest.fn().mockReturnValue(true);
      getMockGetSchema().mockReturnValue(validatePathFunction as never);
      mockGetOccupationGroupChildrenPathParameters.mockReturnValue({ modelId: givenModelId, id: givenId } as never);
      mockTransformPaginatedChildren.mockReturnValue({ data: [], limit: 100, nextCursor: null } as never);

      return {
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${givenModelId}/occupationGroups/${givenId}/children`,
        pathParameters: { modelId: givenModelId, id: givenId },
        headers: headers ?? {},
      } as unknown as APIGatewayProxyEvent;
    }

    function buildServiceMock(availableLanguages: string[] = givenAvailableLanguages): IOccupationGroupService {
      return {
        findChildren: jest.fn().mockResolvedValue([]),
        validateModelForOccupationGroup: jest.fn().mockResolvedValue({ errorCode: null, availableLanguages }),
      } as unknown as IOccupationGroupService;
    }

    test("GET should serve the fallback language and set headers when no Accept-Language header is present", async () => {
      // GIVEN a request without an Accept-Language header
      const givenEvent = buildEvent();
      const givenOccupationGroupServiceMock = buildServiceMock();
      mockGetServiceRegistry().occupationGroup = givenOccupationGroupServiceMock;

      // WHEN calling the handler
      const actualResponse = await OccupationGroupChildrenHandler(givenEvent);

      // THEN expect OK
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND the fallback language is served
      expect(actualResponse.headers?.["Content-Language"]).toEqual(FALLBACK_LANG.shortCode);
      expect(actualResponse.headers?.["Vary"]).toEqual("Accept-Language");
      // AND the service receives the fallback language
      expect(givenOccupationGroupServiceMock.findChildren).toHaveBeenCalledWith(givenId, FALLBACK_LANG.dbKeyName);
    });

    test.each([
      // [description, acceptLanguage header, expected Content-Language served, expected dbKeyName passed to service]
      [
        "serve the fallback language when the client explicitly requests it",
        FALLBACK_LANG.shortCode,
        FALLBACK_LANG.shortCode,
        FALLBACK_LANG.dbKeyName,
      ],
      [
        "serve a secondary language when the model has it and the client requests it",
        SECONDARY_LANG.shortCode,
        SECONDARY_LANG.shortCode,
        SECONDARY_LANG.dbKeyName,
      ],
      [
        "fall back to the fallback language when the client requests an unsupported language",
        "es",
        FALLBACK_LANG.shortCode,
        FALLBACK_LANG.dbKeyName,
      ],
      [
        "fall back to the fallback language when the Accept-Language header is malformed",
        ";;;not-a-language;;;",
        FALLBACK_LANG.shortCode,
        FALLBACK_LANG.dbKeyName,
      ],
      [
        "serve the highest-quality language from a quality-value header",
        `${FALLBACK_LANG.shortCode};q=0.5, ${SECONDARY_LANG.shortCode};q=0.9`,
        SECONDARY_LANG.shortCode,
        SECONDARY_LANG.dbKeyName,
      ],
    ])("GET should %s", async (_description, givenAcceptLanguage, expectedContentLanguage, expectedDbKeyName) => {
      // GIVEN a model with [en, fr] and the client sends Accept-Language: ${givenAcceptLanguage}
      const givenEvent = buildEvent({ "accept-language": givenAcceptLanguage });
      const givenOccupationGroupServiceMock = buildServiceMock();
      mockGetServiceRegistry().occupationGroup = givenOccupationGroupServiceMock;

      // WHEN the handler is called
      const actualResponse = await OccupationGroupChildrenHandler(givenEvent);

      // THEN it responds OK and serves ${expectedContentLanguage} to both the client and repository
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(expectedContentLanguage);
      expect(givenOccupationGroupServiceMock.findChildren).toHaveBeenCalledWith(givenId, expectedDbKeyName);
    });

    test("GET should serve the fallback language when availableLanguages is empty (MODEL_IS_RELEASED)", async () => {
      // GIVEN the model returns availableLanguages: [] (as MODEL_IS_RELEASED does)
      const givenEvent = buildEvent({ "accept-language": SECONDARY_LANG.shortCode });
      const givenOccupationGroupServiceMock = buildServiceMock([]);
      mockGetServiceRegistry().occupationGroup = givenOccupationGroupServiceMock;

      // WHEN calling the handler
      const actualResponse = await OccupationGroupChildrenHandler(givenEvent);

      // THEN the fallback language is served regardless of the Accept-Language header
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(actualResponse.headers?.["Content-Language"]).toEqual(FALLBACK_LANG.shortCode);
      // AND the service receives the fallback language
      expect(givenOccupationGroupServiceMock.findChildren).toHaveBeenCalledWith(givenId, FALLBACK_LANG.dbKeyName);
    });
  });
});
