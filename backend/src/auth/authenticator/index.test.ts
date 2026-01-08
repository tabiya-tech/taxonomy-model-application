//mute chatty console
import "_test_utilities/consoleMock";

import * as Utils from "auth/authenticator/utils";
import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from "aws-lambda";

import { authenticator } from "./index";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { CognitoAuthenticator } from "./cognitoAuthenticator";

function constructEvent(token?: string): APIGatewayRequestAuthorizerEvent {
  return {
    methodArn: getRandomString(10),
    headers: token
      ? {
          Authorization: token,
        }
      : {},
  } as unknown as APIGatewayRequestAuthorizerEvent;
}

function constructResult(result: object) {
  return result as unknown as APIGatewayAuthorizerResult;
}

describe("Custom Authenticator", () => {
  test("should forward anonymous request if there is no authorization header", async () => {
    // GIVEN a request with no authorization header
    const event = constructEvent();

    const actualPolicy = constructResult({ state: "Deny" });
    const generatePolicy = jest.spyOn(Utils, "generatePolicy").mockReturnValue(actualPolicy);

    // WHEN the authenticator is invoked
    const stageResult = await authenticator(event);

    // THEN expect the request to be forwarded to the next lambda with anonymous principal id.
    expect(stageResult).toEqual(actualPolicy);

    // AND generatePolicy should be called with anonymous and Allow.
    expect(generatePolicy).toHaveBeenCalledWith("anonymous", "Allow", event.methodArn);
  });

  test("should authenticate using CognitoAuthenticator if there is an authorization header", async () => {
    // GIVEN the request with an authorization header,
    const givenAuthorizationHeader = getRandomString(10);
    const event = constructEvent(givenAuthorizationHeader);

    // AND the CognitoAuthenticator is mocked to return a value.
    const actualAuthenticateResult = constructResult({ principalId: getRandomString(10) });
    const authenticatorAuthenticate = jest.fn().mockResolvedValue(actualAuthenticateResult);
    jest.spyOn(CognitoAuthenticator, "getInstance").mockImplementation(
      () =>
        ({
          authenticate: authenticatorAuthenticate,
        }) as unknown as CognitoAuthenticator
    );

    // WHEN the authenticator is invoked
    const stageResult = await authenticator(event);

    // THEN expect the request to be forwarded to the next lambda with the mocked principal id.
    expect(stageResult).toEqual(actualAuthenticateResult);

    // AND CognitoAuthenticator.authenticate should be called with the authorization header.
    expect(authenticatorAuthenticate).toHaveBeenCalledWith(givenAuthorizationHeader, event.methodArn);
  });

  test("should deny the request if authentication fails", async () => {
    // GIVEN a request with an authorization header,
    const givenAuthorizationHeader = getRandomString(10);
    const event = constructEvent(givenAuthorizationHeader);

    // AND the CognitoAuthenticator is mocked to throw an error.
    const rejectedError = new Error("Authentication failed");
    const authenticatorAuthenticate = jest.fn().mockRejectedValue(rejectedError);
    jest.spyOn(CognitoAuthenticator, "getInstance").mockImplementation(
      () =>
        ({
          authenticate: authenticatorAuthenticate,
        }) as unknown as CognitoAuthenticator
    );

    const actualPolicy = constructResult({ state: "Deny" });
    const generatePolicy = jest.spyOn(Utils, "generatePolicy").mockReturnValue(actualPolicy);

    // WHEN the authenticator is invoked,
    const stageResult = await authenticator(event);

    // THEN expect the request to be denied.
    expect(generatePolicy).toHaveBeenCalledWith("user", "Deny", event.methodArn);

    // AND the actual policy should be returned.
    expect(stageResult).toEqual(actualPolicy);

    // AND the error should be logged
    expect(console.error).toHaveBeenCalledWith("Authorization failed", rejectedError);
  });
});
