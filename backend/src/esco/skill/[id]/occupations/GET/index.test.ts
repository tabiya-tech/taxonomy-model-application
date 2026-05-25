import "_test_utilities/consoleMock";
import { handler as getOccupationsHandler } from "./index";
import { StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillService } from "../../../services/skill.service.types";
import { ModelForSkillValidationErrorCode } from "../../../_shared/skill.types";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("SkillOccupationsGetController", () => {
  const givenModelId = getMockStringId(1);
  const givenSkillId = getMockStringId(2);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 200 and occupations", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
      getOccupations: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
  });

  test("should return 400 if route does not match", async () => {
    const event = { path: "/invalid/path" };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 404 if model not found", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
  });

  test("should return 404 if skill not found", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
  });

  test("should return 500 if service fails", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
      getOccupations: jest.fn().mockRejectedValue(new Error("DB error")),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should return 400 if query params are invalid", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = {
      path: `/models/${givenModelId}/skills/${givenSkillId}/occupations`,
      queryStringParameters: { limit: "invalid" },
    };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 500 if model validation fails with DB error", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest.fn().mockResolvedValue(ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should return 200 with nextCursor when cursor is present", async () => {
    const givenSkillServiceMock = {
      validateModelForSkill: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue({ id: givenSkillId }),
      getOccupations: jest.fn().mockResolvedValue({
        items: [],
        nextCursor: { _id: "cursorId", createdAt: new Date() },
      }),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);
    const event = { path: `/models/${givenModelId}/skills/${givenSkillId}/occupations` };
    const actualResponse = await getOccupationsHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
  });
});
