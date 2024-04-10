import "_test_utilities/consoleMock";
import { APIGatewayProxyEvent } from "aws-lambda";
import * as AuthModule from "./authenticator";
import { checkRole, RoleRequired } from "./authenticator";
import AuthAPISpecs from "api-specifications/auth";
import * as Validator from "validator";
import { generateCheckRoleTests } from "_test_utilities/RoleBasedAuthroizerTests";
import { STD_ERRORS_RESPONSES } from "server/httpUtils";

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

describe("RoleBasedAuthroizerTests", () => {
  describe("RoleRequired Decorator", () => {
    const handler = new TestLambdaHandler();

    test("should call the original method when the role is valid", () => {
      // GIVEN a method decorated with the RoleRequired decorator
      const givenEvent = {
        requestContext: { authorizer: { claims: { roles: "model-managers" } } },
      } as unknown as APIGatewayProxyEvent;
      // AND a valid role
      jest.spyOn(AuthModule, "checkRole").mockResolvedValueOnce(true);

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

      jest.spyOn(AuthModule, "checkRole").mockResolvedValueOnce(false);
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

  describe("checkRole", () => {
    // Test that the checkRole function works as expected for each role
    generateCheckRoleTests(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER, checkRole);

    generateCheckRoleTests(AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER, checkRole);

    generateCheckRoleTests(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS, checkRole);

    test("should return false if the event context doesn't validate against the expected JSON schema", async () => {
      //GIVEN the event context doesn't validate against the expected JSON schema
      const givenEvent = {
        requestContext: { authorizer: { roles: "model-managers" } }, //missing username key
      } as unknown as APIGatewayProxyEvent;

      //WHEN the checkRole function is called
      const result = await AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

      //THEN expect the output to be false
      expect(result).toBe(false);

      // AND expect the console.error to be called
      expect(console.error).toHaveBeenCalledWith(
        "Invalid JSON schema",
        "[schema validation]  must have required property 'username'"
      );
    });

    test("should return false if a validation error occurs while checking the role", async () => {
      //GIVEN an event
      const givenEvent = {
        requestContext: { authorizer: { roles: "model-managers" } },
      } as unknown as APIGatewayProxyEvent;
      // AND a validation error occurs while checking the role
      jest.spyOn(Validator.ajvInstance, "getSchema").mockImplementationOnce(() => {
        throw new Error("Validation error");
      });

      //WHEN the checkRole function is called
      const result = await AuthModule.checkRole(givenEvent, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

      //THEN expect the output to be false
      expect(result).toBe(false);

      // AND expect the console.error to be called
      expect(console.error).toHaveBeenCalledWith("Error checking role", new Error("Validation error"), {
        event: givenEvent,
      });
    });
  });
});
