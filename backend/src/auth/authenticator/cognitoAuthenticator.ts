import { jwtDecode } from "jwt-decode";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { APIGatewayAuthorizerResult } from "aws-lambda";

import AuthAPISpecs from "api-specifications/auth";
import { CognitoJwtVerifierSingleUserPool } from "aws-jwt-verify/cognito-verifier";

import { generatePolicy } from "auth/authenticator/utils";
import { getUserPoolClientId, getUserPoolId } from "../config";

export type JwtVerifier = CognitoJwtVerifierSingleUserPool<{
  userPoolId: string;
  tokenUse: "access";
}>;

/**
 * Interface for custom authenticator.
 *
 * Each authenticator must implement this interface with the type of credentials it expects and authorize method implementation.
 */

export interface IAuthenticator<Credential> {
  /**
   * Method responsible to authorize used to authorize APIGatewayRequestEvent
   *
   * @param credential - The credential used for auth (e.g., token or API key).
   * @param targetMethodArn - The ARN of the method being accessed.
   * @returns Promise<APIGatewayAuthorizerResult> - the policy document for the next stage.
   */
  authenticate(credential: Credential, targetMethodArn: string): Promise<APIGatewayAuthorizerResult>;
}

export class CognitoAuthenticator implements IAuthenticator<string> {
  private static instance: CognitoAuthenticator;
  private readonly cognitoJwtVerifier: JwtVerifier;
  private readonly userPoolClientId: string;

  private constructor() {
    const userPoolId = getUserPoolId().trim();
    const clientId = getUserPoolClientId().trim();

    if (!userPoolId) throw new Error("Missing USER_POOL_ID environment variable");
    if (!clientId) throw new Error("Missing USER_POOL_CLIENT_ID environment variable");
    this.userPoolClientId = clientId;

    console.info("CognitoAuthorizer initialized", { configs: { userPoolId, clientId } });

    this.cognitoJwtVerifier = CognitoJwtVerifier.create({
      userPoolId: userPoolId,
      tokenUse: "access",
    });
  }

  public static getInstance(): CognitoAuthenticator {
    if (!CognitoAuthenticator.instance) {
      CognitoAuthenticator.instance = new CognitoAuthenticator();
    }

    return CognitoAuthenticator.instance;
  }

  async authenticate(authHeader: string, targetMethodArn: string) {
    const parts = authHeader.trim().split(" ");
    const authType = parts[0];
    const authValue = parts.slice(1).join(" ") || "";

    if (authType !== "Bearer") {
      console.error(`Invalid auth type: ${authType}. Supported types: Bearer`);
      return generatePolicy("user", "Deny", targetMethodArn);
    }

    if (!authValue) {
      console.error("Invalid auth header format - missing auth value");
      return generatePolicy("user", "Deny", targetMethodArn);
    }

    try {
      const unsafeDecodedToken = jwtDecode<{ client_id: string; username?: string }>(authValue);

      let userContext: AuthAPISpecs.Types.Request.Cognito.Context;

      // 1. Handle human in the loop authentication
      if (unsafeDecodedToken.username) {
        const decodedUser = await this.cognitoJwtVerifier.verify(authValue, {
          clientId: this.userPoolClientId,
        });

        console.log("User is authorized", {
          username: decodedUser.username,
          roles: decodedUser["cognito:groups"],
        });

        const groups = decodedUser["cognito:groups"] ?? [];
        userContext = {
          authType: AuthAPISpecs.Enums.Cognito.TokenType.HUMAN_IN_THE_LOOP,
          groups: groups.join(","),
        };
      }

      // 2. Handle machine to machine authentication
      else {
        const decodedClientToken = await this.cognitoJwtVerifier.verify(authValue, {
          clientId: unsafeDecodedToken.client_id,
        });

        userContext = {
          authType: AuthAPISpecs.Enums.Cognito.TokenType.MACHINE_TO_MACHINE,
          clientId: decodedClientToken.client_id,
        };
      }

      // Verify the Jwt token asynchronously
      return generatePolicy("user", "Allow", targetMethodArn, userContext);
    } catch (e: unknown) {
      // token is invalid, deny access
      const error = new Error("Token validation failed", { cause: e });
      console.error(error);

      return generatePolicy("user", "Deny", targetMethodArn);
    }
  }
}
