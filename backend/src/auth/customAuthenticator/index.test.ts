// silence chatty console
import "_test_utilities/consoleMock";
import "_test_utilities/mockSentry";

import * as AuthHandler from "./index";
import { APIGatewayTokenAuthorizerEvent, Context } from "aws-lambda";
import { CognitoJwtVerifierSingleUserPool } from "aws-jwt-verify/cognito-verifier";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";

jest.mock("aws-jwt-verify", () => {
  return {
    CognitoJwtVerifier: {
      create: jest.fn().mockReturnValue({
        verify: jest.fn(),
      }),
    },
  };
});

describe("test for trigger AuthenticationHandler", () => {
  let verifierInstance: CognitoJwtVerifierSingleUserPool<{ userPoolId: string; tokenUse: "access"; clientId: string }>;
  let givenContext: Context;
  let givenCallback: jest.Mock;

  beforeEach(() => {
    // GIVEN a context object
    givenContext = {
      functionName: "foo",
      functionVersion: "bar",
      invokedFunctionArn: "baz",
    } as unknown as Context;

    // AND a callback function
    givenCallback = jest.fn();
  });
  beforeEach(() => {
    verifierInstance = CognitoJwtVerifier.create({
      userPoolId: "foo",
      tokenUse: "access",
      clientId: "bar",
    });
    jest.clearAllMocks();
  });
  test.each([
    ["a single role ", ["model-managers"]],
    ["more than one role", ["model-managers", "admin"]],
    ["no roles", []],
    ["not set", undefined],
  ])(
    "Should allow access to a request with a valid Bearer token when the user has %s in its cognito:groups",
    async (_description: string, givenRoles: string[] | undefined) => {
      // GIVEN a valid token
      const givenToken = "Bearer valid-token";
      // AND an event with the token
      const givenEvent = {
        authorizationToken: givenToken,
        methodArn: "arn:aws:execute-api:regionId:accountId:apiId/stageName/httpVerb/resourcePath",
      } as APIGatewayTokenAuthorizerEvent;
      // AND the token is verified successfully
      const givenDecodedUser = { username: "user", "cognito:groups": givenRoles };
      jest
        .spyOn(verifierInstance, "verify")
        .mockResolvedValueOnce(givenDecodedUser as unknown as CognitoAccessTokenPayload);

      // WHEN the handler is invoked
      const response = await AuthHandler.handler(givenEvent, givenContext, givenCallback);

      // THEN the response should allow access
      expect(response.policyDocument.Statement[0].Effect).toBe("Allow");
      // AND the context should be as expected
      expect(response.context).toEqual({
        username: givenDecodedUser.username,
        roles: givenDecodedUser["cognito:groups"]?.join(",") ?? "",
      });
      // AND the resource should be the same as the event's methodArn
      //@ts-ignore
      expect(response.policyDocument.Statement[0].Resource).toBe(givenEvent.methodArn);
      // AND the console should log the user
      expect(console.log).toHaveBeenCalledWith("User is authorized", { decodedUser: givenDecodedUser });
    }
  );
  test("Should deny access to a request with an invalid token", async () => {
    // GIVEN an invalid token
    const givenToken = "Bearer invalid-token";
    // AND an event with the token
    const givenEvent = {
      authorizationToken: givenToken,
      methodArn: "arn:aws:execute-api:regionId:accountId:apiId/stageName/httpVerb/resourcePath",
    } as APIGatewayTokenAuthorizerEvent;
    // AND the token fails to verify
    const givenError = new Error("Invalid token");
    jest.spyOn(verifierInstance, "verify").mockRejectedValueOnce(givenError);

    // WHEN the handler is invoked
    const response = await AuthHandler.handler(givenEvent, givenContext, givenCallback);

    // THEN the response should deny access
    expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    // AND the context should be empty
    expect(response.context).toBeUndefined();
    // AND the resource should be the same as the event's methodArn
    //@ts-ignore
    expect(response.policyDocument.Statement[0].Resource).toBe(givenEvent.methodArn);
    // AND the console should log the error
    expect(console.error).toHaveBeenCalledWith("Token validation error:", givenError);
  });
  test("Should allow access to a request without a token", async () => {
    // GIVEN an event without a token
    const givenEvent = {
      methodArn: "arn:aws:execute-api:regionId:accountId:apiId/stageName/httpVerb/resourcePath",
    } as APIGatewayTokenAuthorizerEvent;

    // WHEN the handler is invoked
    const response = await AuthHandler.handler(givenEvent, givenContext, givenCallback);

    // THEN the response should allow access
    expect(response.policyDocument.Statement[0].Effect).toBe("Allow");
    // AND the context should be empty
    expect(response.context).toBeUndefined();
    // AND the resource should be the same as the event's methodArn
    //@ts-ignore
    expect(response.policyDocument.Statement[0].Resource).toBe(givenEvent.methodArn);
    // AND the console should log an error
    expect(console.error).toHaveBeenCalledWith("No token provided");
  });
  test("Should allow access to a request with a Bearer token set to ANONYMOUS", async () => {
    // GIVEN an anonymous token
    const givenToken = "Bearer ANONYMOUS";
    // AND an event with the token
    const givenEvent = {
      authorizationToken: givenToken,
      methodArn: "arn:aws:execute-api:regionId:accountId:apiId/stageName/httpVerb/resourcePath",
    } as APIGatewayTokenAuthorizerEvent;

    // WHEN the handler is invoked
    const response = await AuthHandler.handler(givenEvent, givenContext, givenCallback);

    // THEN the response should allow access
    expect(response.policyDocument.Statement[0].Effect).toBe("Allow");
    // AND the context should be empty
    expect(response.context).toBeUndefined();
    // AND the resource should be the same as the event's methodArn
    //@ts-ignore
    expect(response.policyDocument.Statement[0].Resource).toBe(givenEvent.methodArn);
    // AND the console should log an error
    expect(console.error).toHaveBeenCalledWith("No token provided");
  });
  test("Should deny access to a request with an invalid token format", async () => {
    // GIVEN an invalid token format
    const token = "Basic invalid-token";
    // AND an event with the token
    const givenEvent = {
      authorizationToken: token,
      methodArn: "arn:aws:execute-api:regionId:accountId:apiId/stageName/httpVerb/resourcePath",
    } as APIGatewayTokenAuthorizerEvent;

    // WHEN the handler is invoked
    const response = await AuthHandler.handler(givenEvent, givenContext, givenCallback);

    // THEN the response should deny access
    expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    // AND the context should be empty
    expect(response.context).toBeUndefined();
    // AND the resource should be the same as the event's methodArn
    //@ts-ignore
    expect(response.policyDocument.Statement[0].Resource).toBe(givenEvent.methodArn);
    // AND the console should log an error
    expect(console.error).toHaveBeenCalledWith("Invalid token format Basic, only Bearer token is supported");
  });
});
