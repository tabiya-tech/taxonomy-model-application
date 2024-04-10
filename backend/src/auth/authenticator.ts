import { APIGatewayEvent } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import { ajvInstance, ParseValidationError } from "validator";
import { ValidateFunction } from "ajv";
import { STD_ERRORS_RESPONSES } from "server/httpUtils";

export function RoleRequired(requiredRole: AuthAPISpecs.Enums.TabiyaRoles) {
  return function (target: unknown, propertyKey: string, descriptor?: PropertyDescriptor) {
    if (!descriptor?.value) {
      throw new Error("The decorated item is not a method.");
    }
    const originalMethod = descriptor.value;

    descriptor.value = async function (event: APIGatewayEvent) {
      const hasRole = await checkRole(event, requiredRole);
      if (!hasRole) {
        return STD_ERRORS_RESPONSES.FORBIDDEN;
      }
      return originalMethod.apply(this, [event]);
    };

    return descriptor;
  };
}

export const checkRole = async (
  event: APIGatewayEvent,
  requiredRole: AuthAPISpecs.Enums.TabiyaRoles
): Promise<boolean> => {
  try {
    const validateFunction = ajvInstance.getSchema(
      AuthAPISpecs.Schemas.Request.Context.$id as string
    ) as ValidateFunction;
    const contextPayload = event.requestContext.authorizer;
    const isValid = validateFunction(contextPayload);
    if (!isValid) {
      console.error("Invalid JSON schema", ParseValidationError(validateFunction.errors));
      return false;
    }
    // we remove all whitespace from the roles and split them by comma
    return event.requestContext.authorizer?.roles
      .trim()
      .split(",")
      .map((s: string) => s.trim())
      .includes(requiredRole);
  } catch (e) {
    console.error("Error checking role", e, { event });
    return false;
  }
};
