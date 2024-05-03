import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto, { randomUUID } from "crypto";

import AuthAPISpecs from "api-specifications/auth";
import {generateStrongPassword} from "./generateStrongPassword";

// region is frankfurt and should perhaps be exported by the iac instead of hardcoded here
const client = new CognitoIdentityProviderClient({ region: "eu-central-1" });

interface AuthResponse {
  AuthenticationResult: {
    AccessToken: string;
    ExpiresIn: number;
    TokenType: string;
    RefreshToken: string;
    IdToken: string;
  };
}

export class AuthenticateTestCognitoUser {
  private readonly TEST_MODEL_MANAGER_USERNAME = `testModelManagerUser-${randomUUID()}`;
  private readonly TEST_REGISTERED_USER_USERNAME = `testRegisteredUser-${randomUUID()}`;

  async authenticateTestCognitoUser(userName: string, password: string): Promise<string> {
    const clientId = process.env.USER_POOL_CLIENT_ID!;
    const clientSecret = process.env.USER_POOL_CLIENT_SECRET!;
    const clientSecretHash = calculateSecretHash(userName, clientId, clientSecret);
    const params = {
      AuthFlow: "USER_PASSWORD_AUTH" as const,
      ClientId: clientId,
      AuthParameters: {
        USERNAME: userName,
        PASSWORD: password,
        SECRET_HASH: clientSecretHash,
      },
    };

    const command = new InitiateAuthCommand(params);

    try {
      return await client.send(command).then((response) => {
        const authResponse = response as AuthResponse;
        return authResponse.AuthenticationResult.AccessToken;
      });
    } catch (e: unknown) {
      console.error(e);
      throw e;
    }
  }

  async createTestUser(username: string, password: string, userPoolId: string, groupName?: string) {
    // Create User
    const createUserParams = {
      UserPoolId: userPoolId,
      Username: username,
      TemporaryPassword: password,
      UserAttributes: [
        { Name: "email_verified", Value: "true" },
        { Name: "email", Value: `${username}@example.com` },
      ],
      MessageAction: MessageActionType.SUPPRESS, // Suppresses the email that contains the temporary password
    };
    await client.send(new AdminCreateUserCommand(createUserParams));

    // Set a permanent password
    const setUserPasswordParams = {
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true, // This makes the password permanent and bypasses the requirement for change at first login
    };
    await client.send(new AdminSetUserPasswordCommand(setUserPasswordParams));

    // Add to Group
    if (groupName) {
      const addToGroupParams = {
        GroupName: groupName,
        UserPoolId: userPoolId,
        Username: username,
      };
      await client.send(new AdminAddUserToGroupCommand(addToGroupParams));
    }

    // Authenticate User and return the token
    return this.authenticateTestCognitoUser(username, password);
  }

  async deleteTestUser(username: string, userPoolId: string) {
    const params = {
      UserPoolId: userPoolId,
      Username: username,
    };
    await client.send(new AdminDeleteUserCommand(params));
  }

  async setUpUsersWithRoles() {
    const userPoolId = process.env.USER_POOL_ID!;
    const modelManagerToken = await this.createTestUser(
      this.TEST_MODEL_MANAGER_USERNAME,
      generateStrongPassword(),
      userPoolId,
      AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER
    );
    const registeredUserToken = await this.createTestUser(
      this.TEST_REGISTERED_USER_USERNAME,
      generateStrongPassword(),
      userPoolId
    );
    const anonymousUserToken = "ANONYMOUS";

    return {
      "model-managers": modelManagerToken,
      "registered-users": registeredUserToken,
      anonymous: anonymousUserToken,
    };
  }

  async tearDownUsersWithRoles() {
    const userPoolId = process.env.USER_POOL_ID!;
    await this.deleteTestUser(this.TEST_MODEL_MANAGER_USERNAME, userPoolId);
    await this.deleteTestUser(this.TEST_REGISTERED_USER_USERNAME, userPoolId);
  }
}

/**
 * Calculates the Cognito SECRET_HASH
 * @param username The username of the Cognito user
 * @param clientId The Client ID of the Cognito User Pool App Client
 * @param clientSecret The Client Secret of the Cognito User Pool App Client
 * @returns The computed secret hash as a base64-encoded string
 */
function calculateSecretHash(username: string, clientId: string, clientSecret: string): string {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}
