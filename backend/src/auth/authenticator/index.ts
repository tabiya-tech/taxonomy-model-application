import { initializeSentry } from "initializeSentry";
import * as Sentry from "@sentry/aws-serverless";
import { APIGatewayRequestAuthorizerEvent, Handler } from "aws-lambda";

import { Lambdas } from "common/lambda.types";
import { generatePolicy } from "auth/authenticator/utils";
import { CognitoAuthenticator } from "./cognitoAuthenticator";
import { readEnvironmentConfiguration, setConfiguration } from "../config";

initializeSentry(Lambdas.AUTH);

export const authenticator = async (event: APIGatewayRequestAuthorizerEvent) => {
  setConfiguration(readEnvironmentConfiguration());

  console.info("Authenticator invoked", {
    methodArn: event.methodArn,
  });

  // 1. Get the Authorization header.
  const authorizationHeader = event.headers?.Authorization;

  // 2. If None is provided, authorize anonymously
  if (!authorizationHeader) {
    console.info("Anonymous access granted - no authorization header or api key provided");
    return generatePolicy("anonymous", "Allow", event.methodArn);
  }

  try {
    // 5. Get the authenticator
    //    For now only, since we are using AWS-Cognito, only CognitoAuthenticator is supported.
    const authenticator = CognitoAuthenticator.getInstance();

    // 6. Authenticate the request.
    return await authenticator.authenticate(authorizationHeader, event.methodArn);
  } catch (e) {
    console.error("Authorization failed", e);
    return generatePolicy("user", "Deny", event.methodArn);
  }
};

export const handler: Handler = Sentry.wrapHandler(authenticator);
