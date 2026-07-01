import "_test_utilities/consoleMock";
import { handler as skillHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getServiceRegistry, ServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { testMethodsNotAllowed } from "_test_utilities/stdRESTHandlerTests";
import * as postModule from "./POST/index";
import * as getModule from "./GET/index";
import * as getByIdModule from "./[id]/GET/index";
import * as getParentsModule from "./[id]/parents/GET/index";
import * as postParentsModule from "./[id]/parents/POST/index";
import * as getChildrenModule from "./[id]/children/GET/index";
import * as getOccupationsModule from "./[id]/occupations/GET/index";
import * as postOccupationsModule from "./[id]/occupations/POST/index";
import * as getRelatedModule from "./[id]/related/GET/index";
import * as postRelatedModule from "./[id]/related/POST/index";
import * as getHistoryModule from "./[id]/history/GET/index";

jest.mock("server/serviceRegistry/serviceRegistry");
const mockGetServiceRegistry = jest.mocked(getServiceRegistry);

describe("Test for skill router handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServiceRegistry.mockReturnValue({ skill: {} } as unknown as ServiceRegistry);
  });

  test("handler should handle undefined event", async () => {
    const actualResponse = await skillHandler(undefined as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.METHOD_NOT_ALLOWED);
  });

  test("handler should return METHOD_NOT_ALLOWED for non-GET/POST methods", async () => {
    const actualResponse = await skillHandler({
      httpMethod: HTTP_VERBS.PUT,
      path: "/models/123/skills",
    } as never);
    expect(actualResponse.statusCode).toEqual(StatusCodes.METHOD_NOT_ALLOWED);
  });

  test("handler should route POST to postHandler", async () => {
    const postSpy = jest.spyOn(postModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.CREATED,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      path: "/models/123/skills",
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(postSpy).toHaveBeenCalled();
    postSpy.mockRestore();
  });

  test("handler should handle missing path in POST request", async () => {
    const postSpy = jest.spyOn(postModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.CREATED,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(postSpy).toHaveBeenCalled();
    postSpy.mockRestore();
  });

  test("handler should route GET /parents to getParentsHandler", async () => {
    const spy = jest.spyOn(getParentsModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.OK,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}/parents`,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("handler should route POST /parents to postParentsHandler", async () => {
    const spy = jest.spyOn(postParentsModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.CREATED,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}/parents`,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("handler should route POST /occupations to postOccupationsHandler", async () => {
    const spy = jest.spyOn(postOccupationsModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.CREATED,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}/occupations`,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("handler should route POST /related to postRelatedHandler", async () => {
    const spy = jest.spyOn(postRelatedModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.CREATED,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}/related`,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("handler should route GET /children to getChildrenHandler", async () => {
    const spy = jest.spyOn(getChildrenModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.OK,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}/children`,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("handler should route GET /occupations to getOccupationsHandler", async () => {
    const spy = jest.spyOn(getOccupationsModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.OK,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}/occupations`,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("handler should route GET /related to getRelatedHandler", async () => {
    const spy = jest.spyOn(getRelatedModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.OK,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}/related`,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("handler should route GET /history to getHistoryHandler", async () => {
    const spy = jest.spyOn(getHistoryModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.OK,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}/history`,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("handler should route GET /skills/{id} to getByIdHandler when path matches skill route", async () => {
    const spy = jest.spyOn(getByIdModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.OK,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${getMockStringId(1)}/skills/${getMockStringId(2)}`,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("handler should route GET /skills to getHandler", async () => {
    const spy = jest.spyOn(getModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.OK,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${getMockStringId(1)}/skills`,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("handler should route GET event without path to getHandler", async () => {
    const spy = jest.spyOn(getModule, "handler").mockResolvedValue({
      statusCode: StatusCodes.OK,
      body: "",
    } as APIGatewayProxyResult);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  testMethodsNotAllowed([HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH], skillHandler);
});
