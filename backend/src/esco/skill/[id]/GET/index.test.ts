import "_test_utilities/consoleMock";
import { handler as getByIdHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillService } from "../../services/skill.service.types";
import { ISkill } from "../../_shared/skill.types";
import { getISkillMockData } from "../../_shared/testDataHelper";
import * as config from "server/config/config";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("SkillGetByIdController", () => {
  const givenModelId = getMockStringId(1);
  const givenSkillId = getMockStringId(2);
  const givenResourcesBaseUrl = "https://some/path/to/api/resources";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);
  });

  test("should return 200 and the skill", async () => {
    const givenSkill: ISkill = getISkillMockData(1, givenModelId);
    const givenSkillServiceMock = {
      findById: jest.fn().mockResolvedValue(givenSkill),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    };
    const actualResponse = await getByIdHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
  });

  test("should return 404 if skill not found", async () => {
    const givenSkillServiceMock = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    };
    const actualResponse = await getByIdHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
  });

  test("should return 400 if params are invalid", async () => {
    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: "/models/invalid/skills/invalid",
    };
    const actualResponse = await getByIdHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("should return 500 if service throws", async () => {
    const givenSkillServiceMock = {
      findById: jest.fn().mockRejectedValue(new Error("DB error")),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    };
    const actualResponse = await getByIdHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("should return 500 on non-Error exception", async () => {
    const givenSkillServiceMock = {
      findById: jest.fn().mockRejectedValue("string error"),
    } as unknown as ISkillService;
    mockGetServiceRegistry.mockReturnValue({ skill: givenSkillServiceMock } as unknown as ServiceRegistry);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModelId}/skills/${givenSkillId}`,
    };
    const actualResponse = await getByIdHandler(event as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
