import type { APIGatewayEventDefaultAuthorizerContext, APIGatewayAuthorizerResult } from "aws-lambda";

/**
 * Generates an IAM policy document for API Gateway custom authorizers.
 */
export function generatePolicy(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  context?: APIGatewayEventDefaultAuthorizerContext
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context,
  };
}
