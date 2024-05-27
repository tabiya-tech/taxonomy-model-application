import "_test_utilities/consoleMock";
import { APIGatewayProxyEvent } from "aws-lambda";
import * as AuthModule from "./authenticator";
import { checkRole, RoleRequired } from "./authenticator";
import AuthAPISpecs from "api-specifications/auth";
import * as Validator from "validator";
import { generateCheckRoleTests } from "_test_utilities/RoleBasedAuthroizerTests";
import { STD_ERRORS_RESPONSES } from "server/httpUtils";
import { usersRequestContext } from "_test_utilities/dataModel";

// Define a local class specifically for testing
class TestLambdaHandler {
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async handleModelManagerEvent(_event: APIGatewayProxyEvent) {
    return { statusCode: 200, body: "Model Manager Access Granted" };
  }

  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER)
  async handleAdminEvent(_event: APIGatewayProxyEvent) {
    return { statusCode: 200, body: "Admin Access Granted" };
  }

  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async handleAnonymousEvent(_event: APIGatewayProxyEvent) {
    return { statusCode: 200, body: "Anonymous Access Granted" };
  }
}

const throwingFn = () => {
  throw new Error("Validation error");
};

describe("RoleBasedAuthroizerTests", () => {
  describe("checkRole", () => {
    describe("checkRole.ANONYMOUS", () => {
      test("should return true if no token provided", () => {
        // GIVEN no token provided
        const givenEvent = { requestContext: null } as unknown as APIGatewayProxyEvent;

        // WHEN the checkRole function is called
        const result = AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS);

        // THEN expect the output to be true
        expect(result).toBe(true);
      });

      test("should return true if some user is logged in", () => {
        // GIVEN no token provided
        const givenEvent = { requestContext: { authorizer: { username: "foo" } } } as unknown as APIGatewayProxyEvent;

        // WHEN the checkRole function is called
        const result = AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS);

        // THEN expect the output to be true
        expect(result).toBe(true);
      });

      test("should return true if model manager is logged in", () => {
        // GIVEN no token provided
        const givenEvent = { requestContext: { authorizer: { username: "foo" } } } as unknown as APIGatewayProxyEvent;

        // WHEN the checkRole function is called
        const result = AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS);

        // THEN expect the output to be true
        expect(result).toBe(true);
      });
    });

    describe("checkRole.REGISTERED_USER", () => {
      test("should return false if no token provided", () => {
        // GIVEN no token provided
        const givenEvent = { requestContext: null } as unknown as APIGatewayProxyEvent;

        // WHEN the checkRole function is called
        const result = AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER);

        // THEN expect the output to be false
        expect(result).toBe(false);
      });
      test("should return false if invalid schema is provided", () => {
        const validateFn = jest.spyOn(Validator.ajvInstance, "getSchema");

        // GIVEN an invalid schema
        const givenEvent = {
          requestContext: usersRequestContext.MODEL_MANAGER,
        } as unknown as APIGatewayProxyEvent;

        // AND a validation error occurs while checking the role
        validateFn.mockImplementationOnce(throwingFn);

        // WHEN the checkRole function is called
        const result = AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER);

        // THEN expect the output to be false
        expect(result).toBe(false);

        // AND validateFunction should have been called
        expect(validateFn).toHaveBeenCalled();
      });

      test("should return true if a valid token is provided", () => {
        // GIVEN a valid token
        const givenEvent = {
          requestContext: { authorizer: { username: "foo" } },
        } as unknown as APIGatewayProxyEvent;

        // WHEN the checkRole function is called
        const result = AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER);

        // THEN expect the output to be true
        expect(result).toBe(true);
      });
      test("should return true if no roles is provided", () => {
        // GIVEN a user is passed with empty roles
        const givenEvent = {
          requestContext: { authorizer: { username: "foo", roles: "   " } },
        } as unknown as APIGatewayProxyEvent;

        // WHEN the checkRole function is called
        const result = AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER);

        // THEN expect the output to be true
        expect(result).toBe(true);
      });
      test("should return true if a user is a model manager", () => {
        // GIVEN a user is passed with empty roles
        const givenEvent = {
          requestContext: { authorizer: { username: "foo", roles: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER } },
        } as unknown as APIGatewayProxyEvent;

        // WHEN the checkRole function is called
        const result = AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER);

        // THEN expect the output to be true
        expect(result).toBe(true);
      });
    });

    // Valid user Groups
    [AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER].forEach((role) => generateCheckRoleTests(role, checkRole));

    test("should return false if the event context doesn't validate against the expected JSON schema", async () => {
      //GIVEN the event context doesn't validate against the expected JSON schema
      const givenEvent = {
        requestContext: { authorizer: { roles: "model-managers" } }, //missing username key
      } as unknown as APIGatewayProxyEvent;

      //WHEN the checkRole function is called
      const result = AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

      //THEN expect the output to be false
      expect(result).toBe(false);

      // AND expect the console.error to be called
      expect(console.error).toHaveBeenCalledWith(
        "Authorizer context validation failed. Invalid JSON Schema:",
        "[schema validation]  must have required property 'username'"
      );
    });

    test("should return false if a validation error occurs while checking the role", async () => {
      //GIVEN an event
      const givenEvent = {
        requestContext: usersRequestContext.MODEL_MANAGER,
      } as unknown as APIGatewayProxyEvent;

      // AND a validation error occurs while checking the role
      jest.spyOn(Validator.ajvInstance, "getSchema").mockImplementationOnce(throwingFn);

      //WHEN the checkRole function is called
      const result = AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

      //THEN expect the output to be false
      expect(result).toBe(false);

      // AND expect the console.error to be called
      expect(console.error).toHaveBeenCalledWith("Error checking role", new Error("Validation error"), {
        event: givenEvent,
      });
    });
  });

  describe("RoleRequired Decorator", () => {
    const handler = new TestLambdaHandler();

    test("should call the original method when the role is valid", () => {
      // GIVEN a method decorated with the RoleRequired decorator
      const givenEvent = {
        requestContext: { authorizer: { claims: { roles: "model-managers" } } },
      } as unknown as APIGatewayProxyEvent;
      // AND a valid role
      jest.spyOn(AuthModule, "checkRole").mockReturnValue(true);

      // WHEN the method is called with the given event
      const result = handler.handleModelManagerEvent(givenEvent);

      // THEN expect the result to be the original method wrapped in a function that checks the role
      expect(result).resolves.toEqual({ statusCode: 200, body: "Model Manager Access Granted" });
    });

    test("should return a forbidden response if the role is not valid", async () => {
      // GIVEN a role that is not valid
      const givenEvent = {
        requestContext: { authorizer: { claims: { roles: "admin" } } },
      } as unknown as APIGatewayProxyEvent;

      jest.spyOn(AuthModule, "checkRole").mockReturnValue(false);
      // WHEN the decorated method is called
      const result = await handler.handleModelManagerEvent(givenEvent);
      // THEN expect the output to be a forbidden response
      expect(result).toEqual(STD_ERRORS_RESPONSES.FORBIDDEN);
    });

    test("should throw an error if the decorated item is not a method", () => {
      // GIVEN a non-method item
      const target = {};
      const propertyKey = "key";
      const descriptor = { value: undefined };

      // WHEN the RoleRequired decorator is applied
      // THEN expect an error to be thrown
      expect(() =>
        RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)(target, propertyKey, descriptor)
      ).toThrow();
    });
  });
});
