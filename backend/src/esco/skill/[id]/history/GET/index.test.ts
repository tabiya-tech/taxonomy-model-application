import "_test_utilities/consoleMock";
import { handler as getHistoryHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillHistoryEntry, ISkillService } from "esco/skill/services/skill.service.types";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import { ISkillReference } from "esco/skill/_shared/skill.types";
import { IModelInfoReference } from "modelInfo/modelInfo.types";
import { ObjectTypes } from "esco/common/objectTypes";
import SkillAPISpecs from "api-specifications/esco/skill";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("SkillHistoryGetController", () => {
  const givenModelId = getMockStringId(1);
  const givenSkillId = getMockStringId(2);
  const givenPath = `/models/${givenModelId}/skills/${givenSkillId}/history`;

  beforeEach(() => {
    jest.clearAllMocks();
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
    // GIVEN the service resolves a history with one entry: the skill reference + a stripped model reference
    const givenEntity: ISkillReference = {
      id: getMockStringId(2),
      UUID: "d4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f70",
      preferredLabel: "Some skill",
      isLocalized: false,
      objectType: ObjectTypes.Skill,
    };
    const givenModel: IModelInfoReference = {
      id: givenModelId,
      UUID: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      name: "Some model",
      version: "1.0.0",
      localeShortCode: "en",
    };
    const givenHistory: ISkillHistoryEntry[] = [{ entity: givenEntity, model: givenModel }];
    mockService({ getHistory: jest.fn().mockResolvedValue(givenHistory) });

    const actualResponse = await getHistoryHandler({ path: givenPath } as unknown as APIGatewayProxyEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND the handler returns an array of items with the skill reference fields flat and a nested model
    const actualBody = JSON.parse(actualResponse.body);
    expect(actualBody).toHaveLength(1);
    expect(actualBody[0]).toEqual({ ...givenEntity, model: givenModel });
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
