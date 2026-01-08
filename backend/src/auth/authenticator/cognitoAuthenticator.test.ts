//mute chatty console
import "_test_utilities/consoleMock";

import * as JWTDecodeModule from "jwt-decode";
import { CognitoJwtVerifier } from "aws-jwt-verify";

import AuthAPISpecs from "api-specifications/auth";

import * as Utils from "./utils";

import { setConfiguration } from "auth/config";
import { CognitoAuthenticator, type JwtVerifier } from "./cognitoAuthenticator";
import { getTestString } from "_test_utilities/getMockRandomData";

const GIVEN_USER_POOL_ID = "given user pool id";
const GIVEN_USER_POOL_CLIENT_ID = "given client id";

function setupEnvVars(envVars: Record<string, string | undefined | null>) {
  setConfiguration({
    dbURI: getTestString(10),
    userPoolClientId: GIVEN_USER_POOL_CLIENT_ID,
    userPoolId: GIVEN_USER_POOL_ID,
    ...envVars,
  });
}

function setupAuthenticator(authenticateImpl: () => void = () => {}) {
  setupEnvVars({});
  // @ts-ignore - since we are in the tests, we are removing the singleton instance value.
  CognitoAuthenticator.instance = undefined;

  // @ts-ignore - since we are in the tests, we are removing the singleton instance value.
  jest.spyOn(CognitoJwtVerifier, "create").mockReturnValue({
    verify: authenticateImpl,
  } as unknown as JwtVerifier);

  // AND jwtDecode will return the given decoded token value.
  jest.spyOn(JWTDecodeModule, "jwtDecode").mockImplementation(authenticateImpl);

  return CognitoAuthenticator.getInstance();
}

describe("Cognito Authenticator", () => {
  afterEach(() => {
    (console.error as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  describe("Construction", () => {
    test.each([[""], [" "], [undefined], [null]])(
      "should throw an error if environment variable: USER_POOL_ID is missing (%s)",
      (givenMissingUserPoolId) => {
        // GIVEN the environment variable USER_POOL_ID is missing
        setupEnvVars({
          userPoolId: givenMissingUserPoolId,
        });

        // WHEN the CognitoAuthenticator is constructed,
        // THEN an error should be thrown
        expect(() => CognitoAuthenticator.getInstance()).toThrowError("Missing USER_POOL_ID environment variable");
      }
    );

    test.each([[""], [" "], [undefined], [null]])(
      "should throw an error if environment variable: USER_POOL_CLIENT_ID is missing (%s)",
      (givenMissingUserPoolClientId) => {
        // GIVEN the environment variable USER_POOL_CLIENT_ID is missing
        setupEnvVars({
          userPoolClientId: givenMissingUserPoolClientId,
        });

        // WHEN the CognitoAuthenticator is constructed,
        // THEN an error should be thrown
        expect(() => CognitoAuthenticator.getInstance()).toThrowError(
          "Missing USER_POOL_CLIENT_ID environment variable"
        );
      }
    );

    test("should construct the client id successfully when all environment variables are present", () => {
      // GIVEN all required environment variables are present
      setupEnvVars({});

      // AND CognitoJwtVerifier is mocked.
      const cognitoJwtVerifierCreate = jest
        .spyOn(CognitoJwtVerifier, "create")
        // @ts-ignore - since we are in the tests, we are removing the singleton instance value.
        .mockReturnValue({} as unknown as JwtVerifier);

      // WHEN the CognitoAuthenticator is constructed,
      const authenticator = CognitoAuthenticator.getInstance();

      // THEN no error should be thrown,
      // AND cognitoJwtVerifierCreate should be called with the correct parameters
      expect(cognitoJwtVerifierCreate).toBeCalledWith({
        userPoolId: GIVEN_USER_POOL_ID,
        tokenUse: "access",
      });

      // AND the authenticator should be constructed successfully
      expect(authenticator).toBeDefined();

      // WHEN the getInstance method is called again,
      // THEN the same instance should be returned
      expect(CognitoAuthenticator.getInstance()).toBe(authenticator);

      // AND cognitoJwtVerifierCreate should not be called again
      expect(cognitoJwtVerifierCreate).toBeCalledTimes(1);
    });
  });

  describe("Authenticate Function", () => {
    let generatePolicySpy: jest.SpyInstance;

    beforeEach(() => {
      generatePolicySpy = jest.spyOn(Utils, "generatePolicy");
    });

    afterEach(() => {
      generatePolicySpy.mockClear();
    });

    test.each([
      [[AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER], [AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER]],
      [undefined, []],
    ])("should allow if the token is valid", async (givenGroups, expectedGroups) => {
      // GIVEN a basic auth token
      const givenInvalidToken = "Bearer given-invalid-token";

      // AND verify will throw an invalid token
      const decodedTokenValue = {
        username: "some-user-name",
        "cognito:groups": givenGroups,
      };
      const authenticateFn = () => decodedTokenValue;
      const cognitoAuthenticator = setupAuthenticator(authenticateFn);

      // AND a target method arn
      const givenTargetMethodArn = "given target method arn";

      // AND generatePolicySpy will return the expected policy result
      const expectedPolicyResult = { foo: "bar" };

      generatePolicySpy.mockReturnValue(expectedPolicyResult);

      // WHEN the authenticate function is called,
      const actualPolicyResult = await cognitoAuthenticator.authenticate(givenInvalidToken, givenTargetMethodArn);

      // THEN the no error should be logged
      expect(console.error).not.toHaveBeenCalled();

      // AND generatePolicy should be called with Deny effect
      expect(generatePolicySpy).toHaveBeenCalledOnce();
      expect(generatePolicySpy).toHaveBeenCalledWith("user", "Allow", givenTargetMethodArn, {
        authType: AuthAPISpecs.Enums.Cognito.TokenType.HUMAN_IN_THE_LOOP,
        groups: expectedGroups.join(","),
      });

      // AND the result should be the dummy value
      expect(actualPolicyResult).toBe(expectedPolicyResult);
    });

    test("should deny if the auth type is not Bearer", async () => {
      const cognitoAuthenticator = setupAuthenticator();

      // GIVEN a basic auth token
      const givenInvalidToken = "Basic invalid-token";

      // AND a target method arn
      const givenTargetMethodArn = "given target method arn";

      // AND generatePolicySpy will return the expected policy result
      const expectedPolicyResult = { foo: "bar" };

      generatePolicySpy.mockReturnValue(expectedPolicyResult);

      // WHEN the authenticate function is called,
      const actualPolicyResult = await cognitoAuthenticator.authenticate(givenInvalidToken, givenTargetMethodArn);

      // THEN generatePolicy should be called with Deny effect
      expect(generatePolicySpy).toHaveBeenCalledOnce();
      expect(generatePolicySpy).toHaveBeenCalledWith("user", "Deny", givenTargetMethodArn);

      // AND the error should be logged
      expect(console.error).toBeCalledWith("Invalid auth type: Basic. Supported types: Bearer");

      // AND the result should be the dummy value
      expect(actualPolicyResult).toBe(expectedPolicyResult);
    });

    test("should deny if the auth value is missing", async () => {
      const cognitoAuthenticator = setupAuthenticator();

      // GIVEN a basic auth token
      const givenInvalidToken = "Bearer";

      // AND a target method arn
      const givenTargetMethodArn = "given target method arn";

      // AND generatePolicySpy will return the expected policy result
      const expectedPolicyResult = { foo: "bar" };

      generatePolicySpy.mockReturnValue(expectedPolicyResult);

      // WHEN the auth function is called,
      const actualPolicyResult = await cognitoAuthenticator.authenticate(givenInvalidToken, givenTargetMethodArn);

      // THEN generatePolicy should be called with Deny effect
      expect(generatePolicySpy).toHaveBeenCalledOnce();
      expect(generatePolicySpy).toHaveBeenCalledWith("user", "Deny", givenTargetMethodArn);

      // AND the error should be logged
      expect(console.error).toBeCalledWith("Invalid auth header format - missing auth value");

      // AND the result should be the dummy value
      expect(actualPolicyResult).toBe(expectedPolicyResult);
    });

    describe("Human in the loop authentication", () => {
      test("should deny if token verification fails", async () => {
        // GIVEN a basic auth token
        const givenInvalidToken = "Bearer given-invalid-token";

        // AND verify will throw an invalid token
        const invalidTokenError = new Error("Invalid token");
        const authenticateFn = () => {
          throw invalidTokenError;
        };
        const cognitoAuthenticator = setupAuthenticator(authenticateFn);

        // AND a target method arn
        const givenTargetMethodArn = "given target method arn";

        // AND generatePolicySpy will return the expected policy result
        const expectedPolicyResult = { foo: "bar" };

        generatePolicySpy.mockReturnValue(expectedPolicyResult);

        // WHEN the authenticate function is called,
        const actualPolicyResult = await cognitoAuthenticator.authenticate(givenInvalidToken, givenTargetMethodArn);

        // THEN generatePolicy should be called with Deny effect
        expect(generatePolicySpy).toHaveBeenCalledOnce();
        expect(generatePolicySpy).toHaveBeenCalledWith("user", "Deny", givenTargetMethodArn);

        // AND the error should be logged
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));

        // AND the result should be the dummy value
        expect(actualPolicyResult).toBe(expectedPolicyResult);
      });
    });

    describe("Machine to machine authentication", () => {
      test("should allow if the M2M token is valid", async () => {
        // GIVEN a Bearer token with a client_id (M2M token)
        const givenM2MToken = "Bearer given-m2m-token";

        // AND jwtDecode will return a decoded token with client_id (no username)
        const givenClientId = "some-client-id";
        const decodedTokenValue = {
          client_id: givenClientId,
        };

        // AND verify will return the verified token
        const verifiedTokenValue = {
          client_id: givenClientId,
        };

        const authenticateFn = () => decodedTokenValue;
        const cognitoAuthenticator = setupAuthenticator(authenticateFn);

        // Mock the verify method to return the verified token
        // @ts-expect-error - mocking for test purposes
        jest.spyOn(cognitoAuthenticator["cognitoJwtVerifier"], "verify").mockResolvedValue(verifiedTokenValue);

        // AND a target method arn
        const givenTargetMethodArn = "given target method arn";

        // AND generatePolicySpy will return the expected policy result
        const expectedPolicyResult = { foo: "bar" };
        generatePolicySpy.mockReturnValue(expectedPolicyResult);

        // WHEN the authenticate function is called
        const actualPolicyResult = await cognitoAuthenticator.authenticate(givenM2MToken, givenTargetMethodArn);

        // THEN no error should be logged
        expect(console.error).not.toHaveBeenCalled();

        // AND generatePolicy should be called with Allow effect and M2M context
        expect(generatePolicySpy).toHaveBeenCalledOnce();
        expect(generatePolicySpy).toHaveBeenCalledWith("user", "Allow", givenTargetMethodArn, {
          authType: AuthAPISpecs.Enums.Cognito.TokenType.MACHINE_TO_MACHINE,
          clientId: givenClientId,
        });

        // AND the result should be the expected policy
        expect(actualPolicyResult).toBe(expectedPolicyResult);
      });

      test("should deny if the M2M token verification fails", async () => {
        // GIVEN a Bearer token with a client_id (M2M token)
        const givenM2MToken = "Bearer given-invalid-m2m-token";

        // AND jwtDecode will return a decoded token with client_id (no username)
        const givenClientId = "some-client-id";
        const decodedTokenValue = {
          client_id: givenClientId,
        };

        // AND verify will throw an error
        const invalidTokenError = new Error("Invalid M2M token");
        const authenticateFn = () => decodedTokenValue;
        const cognitoAuthenticator = setupAuthenticator(authenticateFn);

        jest.spyOn(cognitoAuthenticator["cognitoJwtVerifier"], "verify").mockRejectedValue(invalidTokenError);

        // AND a target method arn
        const givenTargetMethodArn = "given target method arn";

        // AND generatePolicySpy will return the expected policy result
        const expectedPolicyResult = { foo: "bar" };
        generatePolicySpy.mockReturnValue(expectedPolicyResult);

        // WHEN the authenticate function is called
        const actualPolicyResult = await cognitoAuthenticator.authenticate(givenM2MToken, givenTargetMethodArn);

        // THEN generatePolicy should be called with Deny effect
        expect(generatePolicySpy).toHaveBeenCalledOnce();
        expect(generatePolicySpy).toHaveBeenCalledWith("user", "Deny", givenTargetMethodArn);

        // AND the error should be logged
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));

        // AND the result should be the expected policy
        expect(actualPolicyResult).toBe(expectedPolicyResult);
      });

      test("should verify M2M token with the client_id from the decoded token", async () => {
        // GIVEN a Bearer token with a client_id (M2M token)
        const givenM2MToken = "Bearer given-m2m-token";

        // AND jwtDecode will return a decoded token with a specific client_id
        const givenClientId = "specific-client-id";
        const decodedTokenValue = {
          client_id: givenClientId,
        };

        const verifiedTokenValue = {
          client_id: givenClientId,
        };

        const authenticateFn = () => decodedTokenValue;
        const cognitoAuthenticator = setupAuthenticator(authenticateFn);

        // Mock the verify method
        const verifySpy = jest
          .spyOn(cognitoAuthenticator["cognitoJwtVerifier"], "verify")
          // @ts-expect-error - mocking for test purposes
          .mockResolvedValue(verifiedTokenValue);

        // AND a target method arn
        const givenTargetMethodArn = "given target method arn";

        // AND generatePolicySpy will return the expected policy result
        const expectedPolicyResult = { foo: "bar" };
        generatePolicySpy.mockReturnValue(expectedPolicyResult);

        // WHEN the authenticate function is called
        await cognitoAuthenticator.authenticate(givenM2MToken, givenTargetMethodArn);

        // THEN verify should be called with the token and clientId from the decoded token
        expect(verifySpy).toHaveBeenCalledWith(givenM2MToken.split(" ")[1], {
          clientId: givenClientId,
        });
      });
    });
  });
});
