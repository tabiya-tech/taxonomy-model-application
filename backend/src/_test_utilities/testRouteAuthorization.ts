import { StatusCodes } from "server/httpUtils";
import AuthAPISpecs from "api-specifications/auth";
import { SuperAgentTest } from "supertest";

export type TestScenario = {
  description: string;
  token: string;
  expectedStatus?: number;
  expectedExceptions?: number[];
};

export type AllowedMethods = "GET" | "POST";

// By default, requests with no token, malformed token, and invalid token are expected to return 401, 403, and 403 respectively
export const STD_ROUTE_AUTHORIZATION_RESPONSE_SCENARIO: TestScenario[] = [
  { description: "malformed token", token: "MALFORMED", expectedStatus: StatusCodes.FORBIDDEN },
  { description: "with invalid token", token: "Bearer INVALID", expectedStatus: StatusCodes.FORBIDDEN },
];

export const testSTDRoutesAuthorization = (
  route: string,
  method: AllowedMethods,
  allowedRoles: AuthAPISpecs.Enums.TabiyaRoles[],
  request: SuperAgentTest
) => {
  test.each(STD_ROUTE_AUTHORIZATION_RESPONSE_SCENARIO)("%s should respond accordingly", async (scenario) => {
    const response = await generateRequest(request, route, method, scenario.token).timeout(5000);
    if (scenario.expectedStatus) {
      expect(response.statusCode).toBe(scenario.expectedStatus);
    } else {
      expect(response.statusCode).not.toBeOneOf([StatusCodes.UNAUTHORIZED, StatusCodes.FORBIDDEN]);
    }
  });
};

export const generateRequest = (request: SuperAgentTest, route: string, method: AllowedMethods, token: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function withToken(request: any) {
    if (token) {
      return request.set("Authorization", `Bearer ${token}`);
    }

    return request;
  }

  switch (method) {
    case "GET":
      return withToken(request.get(route));
    case "POST":
      return withToken(request.post(route)).send({
        /* empty body */
      });
    default:
      throw new Error("Unsupported method");
  }
};
