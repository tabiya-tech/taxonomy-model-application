import { APIGatewayProxyEvent } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";

export function generateCheckRoleTests(
  givenRole: AuthAPISpecs.Enums.TabiyaRoles,
  givenMethod: (event: APIGatewayProxyEvent, requiredRole: AuthAPISpecs.Enums.TabiyaRoles) => boolean
) {
  describe(`checkRole Tests for Role: ${givenRole}`, () => {
    test.each([
      ["Exact role match", givenRole, true],
      ["No roles provided", "", false],
      ["Incorrect role", "foo", false],
      ["Multiple roles, one correct", `foo, ${givenRole}`, true],
      ["Multiple roles, none correct", "foo, bar", false],
      ["case insensitive roles", `${givenRole.substring(0, 3).toUpperCase() + givenRole.substring(3)}`, false],
      ["Substring roles", `${givenRole}ish`, false],
      ["Empty string role", " ", false],
      ["Null roles", null, false],
      ["Undefined roles", undefined, false],
      ["Roles with whitespace", ` ${givenRole} `, true],
    ])(
      `%s (values: %s) should return %s`,
      async (_description: string, testRole: string | null | undefined, expected) => {
        // GIVEN a mocked checkRole function and a specific role
        const event = {
          requestContext: { authorizer: { username: "user", roles: testRole } },
        } as unknown as APIGatewayProxyEvent;

        // WHEN the method is called
        const result = givenMethod(event, givenRole);

        // THEN the result should be as expected
        expect(result).toBe(expected);
      }
    );
  });
}
