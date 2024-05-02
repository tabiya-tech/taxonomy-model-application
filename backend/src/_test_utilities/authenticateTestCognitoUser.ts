import {CognitoIdentityProviderClient, InitiateAuthCommand} from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';

/**
 * Calculates the Cognito SECRET_HASH
 * @param username The username of the Cognito user
 * @param clientId The Client ID of the Cognito User Pool App Client
 * @param clientSecret The Client Secret of the Cognito User Pool App Client
 * @returns The computed secret hash as a base64-encoded string
 */
function calculateSecretHash(username: string, clientId: string, clientSecret: string): string {
  return crypto.createHmac('SHA256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}

// region is frankfurt and should perhaps be exported by the iac instead of hardcoded here
const client = new CognitoIdentityProviderClient({ region: 'eu-central-1'});

interface AuthResponse {
  AuthenticationResult: {
    AccessToken: string;
    ExpiresIn: number;
    TokenType: string;
    RefreshToken: string;
    IdToken: string;
  };
}

export async function authenticateTestCognitoUser(userName: string, password: string): Promise<string> {
  const clientId =  process.env.USER_POOL_CLIENT_ID!;
  const clientSecret = process.env.USER_POOL_CLIENT_SECRET!;
  const clientSecretHash = calculateSecretHash(userName, clientId, clientSecret);
  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH' as const,
    ClientId: clientId,
    AuthParameters: {
      USERNAME: userName,
      PASSWORD: password,
      "SECRET_HASH": clientSecretHash,
    }
  };

  const command = new InitiateAuthCommand(params);

  try{
    return await client.send(command).then((response) => {
      const authResponse = response as AuthResponse;
      return authResponse.AuthenticationResult.AccessToken;
    });
  } catch (e: unknown) {
    console.error(e);
    throw e;
  }
}

export const setUpUsersWithRoles = async () => {
  const modelManagerUserToken = await authenticateTestCognitoUser(
    process.env.TEST_MODEL_MANAGER_USERNAME!,
    process.env.TEST_MODEL_MANAGER_PASSWORD!
  );
  const registeredUserToken = await authenticateTestCognitoUser(
    process.env.TEST_REGISTERED_USER_USERNAME!,
    process.env.TEST_REGISTERED_USER_PASSWORD!
  );
  const anonymousUserToken = "ANONYMOUS";

  return {
    "model-managers": modelManagerUserToken,
    "registered-users": registeredUserToken,
    anonymous: anonymousUserToken,
  };
};
