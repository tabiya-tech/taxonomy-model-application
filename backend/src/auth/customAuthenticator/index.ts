import { Handler } from "aws-lambda";
import { APIGatewayEventDefaultAuthorizerContext } from "aws-lambda/common/api-gateway";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import AuthAPISpecs from "api-specifications/auth";
import { initializeSentry } from "initializeSentry";
import * as Sentry from "@sentry/aws-serverless";
import { Lambdas } from "common/lambda.types";

initializeSentry(Lambdas.AUTH);

const userPoolId = process.env.USER_POOL_ID!;
const clientId = process.env.USER_POOL_CLIENT_ID!;

const verifier = CognitoJwtVerifier.create({
  userPoolId: userPoolId,
  tokenUse: "access",
  clientId: clientId,
});

export const handler: Handler = Sentry.wrapHandler(async (event) => {
  let token = "";
  if (event.authorizationToken) {
    const parts = event.authorizationToken.split(" ");
    if (parts[0] !== "Bearer") {
      console.error(`Invalid token format ${parts[0]}, only Bearer token is supported`);
      return generatePolicy("user", "Deny", event.methodArn);
    }
    token = parts[1];
  }

  if (!token || token === "ANONYMOUS") {
    console.error("No token provided");
    // attach an anonymous user to the event context
    return generatePolicy("anonymous", "Allow", event.methodArn);
  }

  try {
    // Verify the token asynchronously
    const decodedUser = await verifier.verify(token);

    console.log("User is authorized", { decodedUser });

    const userContext: AuthAPISpecs.Types.Request.Context = {
      username: decodedUser.username,
      roles: decodedUser["cognito:groups"]?.join(",") ?? "",
    };

    return generatePolicy("user", "Allow", event.methodArn, userContext);
  } catch (error) {
    // token is invalid, deny access
    console.error("Token validation error:", error);
    return generatePolicy("user", "Deny", event.methodArn);
  }
});

function generatePolicy(
  principalId: string,
  effect: string,
  resource: string,
  context?: APIGatewayEventDefaultAuthorizerContext
) {
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
