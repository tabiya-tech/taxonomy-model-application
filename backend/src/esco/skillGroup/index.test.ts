import { handler } from "./index";
import { HTTP_VERBS, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";

// Mock the sub-handlers
jest.mock("./GET/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET" }),
}));
jest.mock("./POST/index", () => ({ handler: jest.fn().mockResolvedValue({ statusCode: 201, body: "POST" }) }));
jest.mock("./[id]/GET/index", () => ({ handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_BY_ID" }) }));
jest.mock("./[id]/parents/GET/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_PARENT" }),
}));
jest.mock("./[id]/parents/POST/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 201, body: "POST_PARENT" }),
}));
jest.mock("./[id]/children/GET/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_CHILDREN" }),
}));
jest.mock("./[id]/history/GET/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_HISTORY" }),
}));
import { handler as getHandler } from "./GET/index";
import { handler as postHandler } from "./POST/index";
import { handler as getByIdHandler } from "./[id]/GET/index";
import { handler as getParentsHandler } from "./[id]/parents/GET/index";
import { handler as postParentsHandler } from "./[id]/parents/POST/index";
import { handler as getChildrenHandler } from "./[id]/children/GET/index";
import { handler as getHistoryHandler } from "./[id]/history/GET/index";
jest.mock("./[id]/parents/POST/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "POST_PARENT" }),
}));
describe("SkillGroups Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should route GET skillGroups list to getHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/skillGroups" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET");
  });
  test("should route GET skillGroup by ID to getByIdHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/skillGroups/2" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getByIdHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_BY_ID");
  });
  test("should route GET parents to getParentsHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/skillGroups/2/parents" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getParentsHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_PARENT");
  });
  test("should route GET children to getChildrenHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/skillGroups/2/children" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getChildrenHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_CHILDREN");
  });
  test("should route GET history to getHistoryHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/skillGroups/2/history" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getHistoryHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_HISTORY");
  });
  test("should route POST to postHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.POST, path: "/models/1/skillGroups" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(postHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("POST");
  });
  test("should route POST parents to postParentsHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.POST, path: "/models/1/skillGroups/2/parents" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(postParentsHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("POST_PARENT");
  });
  test("should return METHOD_NOT_ALLOWED for unsupported verbs", async () => {
    const event = { httpMethod: HTTP_VERBS.DELETE } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(response).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
  });
  test("should handle missing path in GET request", async () => {
    const event = { httpMethod: HTTP_VERBS.GET } as unknown as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET");
  });
  test("should route POST parents to postParentsHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.POST, path: "/models/1/skillGroups/2/parents" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(postParentsHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("POST_PARENT");
  });
  test("should handle missing path in POST request", async () => {
    const event = { httpMethod: HTTP_VERBS.POST } as unknown as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(response).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
  });
});
