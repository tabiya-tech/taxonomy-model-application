import "_test_utilities/consoleMock";
import * as transformModule from "modelInfo/transform";
import { handler as getHistoryHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillHistoryEntry, ISkillService } from "../../../services/skill.service.types";
import { ModelForSkillValidationErrorCode } from "../../../_shared/skill.types";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import SkillAPISpecs from "api-specifications/esco/skill";
import * as config from "server/config/config";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("SkillHistoryGetController", () => {
  const givenModelId = getMockStringId(1);
  const givenSkillId = getMockStringId(2);
  const givenPath = `/models/${givenModelId}/skills/${givenSkillId}/history`;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue("https://resources.example.com");
  });

  function mockService(overrides: Partial<ISkillService>) {
    const service = {
      validateModelForSkill: jest.fn().mockResolvedValue(null),
      getHistory: jest.fn().mockResolvedValue([]),
      ...overrides,
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: service } as unknown as ServiceRegistry);
    return service;
  }

  test("should return 200 and the history for a valid skill", async () => {
    const transformSpy = jest.spyOn(transformModule, "transform");
    const givenModel = getIModelInfoMockData(3);
    const givenHistory: ISkillHistoryEntry[] = [{ model: givenModel, modelHistoryDetails: [] }];
    mockService({ getHistory: jest.fn().mockResolvedValue(givenHistory) });

    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(transformSpy).toHaveBeenCalledWith(givenModel, "https://resources.example.com", []);
    expect(JSON.parse(actualResponse.body)).toHaveLength(1);
  });

  test("should return 200 and an empty array when the history is empty", async () => {
    mockService({ getHistory: jest.fn().mockResolvedValue([]) });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body)).toEqual([]);
  });

  test("should return 200 when the model is released (history includes released models)", async () => {
    const service = mockService({
      validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.MODEL_IS_RELEASED),
      getHistory: jest.fn().mockResolvedValue([]),
    });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(service.getHistory).toHaveBeenCalledWith(givenSkillId);
  });

  test("should return 400 if route does not match", async () => {
    mockService({});
    const actualResponse = await getHistoryHandler({ path: "/invalid/path" } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 404 if model not found", async () => {
    mockService({
      validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
    });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status404.History.ErrorCodes.MODEL_NOT_FOUND
    );
  });

  test("should return 404 if the skill does not exist", async () => {
    mockService({ getHistory: jest.fn().mockResolvedValue(null) });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status404.History.ErrorCodes.SKILL_NOT_FOUND
    );
  });

  test("should return 500 when model validation fails to fetch from the DB", async () => {
    mockService({
      validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
    });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should return 500 when the service throws", async () => {
    mockService({ getHistory: jest.fn().mockRejectedValue(new Error("DB error")) });
    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status500.History.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_HISTORY
    );
  });
});
