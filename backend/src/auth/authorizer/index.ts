import { APIGatewayEvent } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import { ValidateFunction } from "ajv";
import { ajvInstance, ParseValidationError } from "validator";

import { STD_ERRORS_RESPONSES } from "server/httpUtils";

import { initOnce } from "auth/init";
import { getDependencyRegistry } from "auth/dependencyRegistry";
import { APIKeyAuthorizer, HumanInTheLoopAuthorizer, MachineToMachineTokenAuthorizer } from "./authorizers";

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
    if (requiredRole === AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS) return true;

    await initOnce();
    const accessKeyService = getDependencyRegistry().accessKey;

    // 1. API Key authorization
    if (event.requestContext.identity?.apiKeyId) {
      const authorizer = new APIKeyAuthorizer(accessKeyService, event.requestContext.identity.apiKeyId);
      return await authorizer.hasRole(requiredRole);
    }

    // 2. Cognito JWT authorization
    const validateFunction = ajvInstance.getSchema(AuthAPISpecs.Schemas.Request.Context.$id) as ValidateFunction;
    const contextPayload = event.requestContext.authorizer as AuthAPISpecs.Types.Request.Cognito.Context;

    const isValid = validateFunction(contextPayload);

    if (!isValid) {
      console.error(
        "Authorizer context validation failed. Invalid JSON Schema:",
        ParseValidationError(validateFunction.errors),
        { contextPayload }
      );
      return false;
    }

    // 2.1. Cognito: Human-in-the-loop
    if (contextPayload.authType === AuthAPISpecs.Enums.Cognito.TokenType.HUMAN_IN_THE_LOOP) {
      const groups = contextPayload.groups
        .split(",")
        .filter((group) =>
          Object.values(AuthAPISpecs.Enums.TabiyaRoles).includes(group as AuthAPISpecs.Enums.TabiyaRoles)
        ) as AuthAPISpecs.Enums.TabiyaRoles[];
      const authorizer = new HumanInTheLoopAuthorizer(groups);
      return await authorizer.hasRole(requiredRole);
    }

    // 2.2. Cognito: Machine-to-machine
    else {
      const authorizer = new MachineToMachineTokenAuthorizer(accessKeyService, contextPayload.clientId);
      return await authorizer.hasRole(requiredRole);
    }
  } catch (e) {
    console.error("Error checking role", e, { event });
    return false;
  }
};
