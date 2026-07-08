import { handler } from "./index";
import { HTTP_VERBS, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";

// Mock the sub-handlers
jest.mock("./GET/index", () => ({ handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET" }) }));
jest.mock("./POST/index", () => ({ handler: jest.fn().mockResolvedValue({ statusCode: 201, body: "POST" }) }));
jest.mock("./[id]/parent/POST/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 201, body: "POST_PARENT" }),
}));
jest.mock("./[id]/GET/index", () => ({ handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_BY_ID" }) }));
jest.mock("./[id]/parent/GET/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_PARENT" }),
}));
jest.mock("./[id]/children/GET/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_CHILDREN" }),
}));
jest.mock("./[id]/skills/GET/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "GET_SKILLS" }),
}));
jest.mock("./[id]/skills/POST/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 201, body: "POST_SKILLS" }),
}));
jest.mock("./[id]/PUT/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "PUT" }),
}));
jest.mock("./[id]/PATCH/index", () => ({
  handler: jest.fn().mockResolvedValue({ statusCode: 200, body: "PATCH" }),
}));

import { handler as getHandler } from "./GET/index";
import { handler as postHandler } from "./POST/index";
import { handler as getByIdHandler } from "./[id]/GET/index";
import { handler as getParentHandler } from "./[id]/parent/GET/index";
import { handler as postParentHandler } from "./[id]/parent/POST/index";
import { handler as getChildrenHandler } from "./[id]/children/GET/index";
import { handler as getSkillsHandler } from "./[id]/skills/GET/index";
import { handler as postSkillsHandler } from "./[id]/skills/POST/index";
import { handler as putByIdHandler } from "./[id]/PUT/index";
import { handler as patchByIdHandler } from "./[id]/PATCH/index";

describe("Occupations Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should route POST to postHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.POST, path: "/models/1/occupations" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(postHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("POST");
  });

  test("should route POST parent to postParentHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.POST, path: "/models/1/occupations/2/parent" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(postParentHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("POST_PARENT");
  });

  test("should route POST skills to postSkillsHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.POST, path: "/models/1/occupations/2/skills" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(postSkillsHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("POST_SKILLS");
  });

  test("should route GET occupations list to getHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/occupations" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET");
  });

  test("should route GET occupation by ID to getByIdHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/occupations/2" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getByIdHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_BY_ID");
  });

  test("should route GET parent to getParentHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/occupations/2/parent" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getParentHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_PARENT");
  });

  test("should route GET children to getChildrenHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/occupations/2/children" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getChildrenHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_CHILDREN");
  });

  test("should route GET skills to getSkillsHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.GET, path: "/models/1/occupations/2/skills" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(getSkillsHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("GET_SKILLS");
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

  test("should handle missing path in POST request", async () => {
    const event = { httpMethod: HTTP_VERBS.POST } as unknown as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(postHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("POST");
  });

  test("should route PUT to putByIdHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.PUT, path: "/models/1/occupations/2" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(putByIdHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("PUT");
  });

  test("should route PATCH to patchByIdHandler", async () => {
    const event = { httpMethod: HTTP_VERBS.PATCH, path: "/models/1/occupations/2" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(patchByIdHandler).toHaveBeenCalledWith(event);
    expect(response.body).toBe("PATCH");
  });

  test("should return METHOD_NOT_ALLOWED for PUT without matching path", async () => {
    const event = { httpMethod: HTTP_VERBS.PUT, path: "/invalid/path" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(response).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
  });

  test("should return METHOD_NOT_ALLOWED for PATCH without matching path", async () => {
    const event = { httpMethod: HTTP_VERBS.PATCH, path: "/invalid/path" } as APIGatewayProxyEvent;
    const response = await handler(event);
    expect(response).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
  });
});
