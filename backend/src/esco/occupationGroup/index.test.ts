import { handler } from "./index";
import { HTTP_VERBS, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";

// Mock the sub-handlers
jest.mock("./GET/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET" }),
}));
jest.mock("./POST/index", () => ({ handler: jest.fn().mockResolvedValue({ statusCode: 201, body: "POST" }) }));
jest.mock("./[id]/GET/index", () => ({ handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_BY_ID" }) }));
jest.mock("./[id]/parent/GET/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_PARENT" }),
}));
jest.mock("./[id]/children/GET/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_CHILDREN" }),
}));
import { handler as getHandler } from "./GET/index";
import { handler as postHandler } from "./POST/index";
import { handler as getByIdHandler } from "./[id]/GET/index";
import { handler as getParentHandler } from "./[id]/parent/GET/index";
import { handler as getChildrenHandler } from "./[id]/children/GET/index";
describe("OccupationGroups Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should route POST to postHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.POST } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(postHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("POST");
  });
  test("should route GET occupationGroups list to getHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/occupationGroups" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET");
  });
  test("should route GET occupationGroup by ID to getByIdHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/occupationGroups/2" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getByIdHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_BY_ID");
  });
  test("should route GET parent to getParentHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/occupationGroups/2/parent" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getParentHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_PARENT");
  });
  test("should route GET children to getChildrenHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/occupationGroups/2/children" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getChildrenHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_CHILDREN");
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
});
