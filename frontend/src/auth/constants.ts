import { getAuthUrl, getCognitoClientId, getCognitoClientSecretId } from "../envService";

export const AUTH_URL = getAuthUrl();
export const REDIRECT_URL = window.location.origin;
export const COGNITO_CLIENT_ID = getCognitoClientId();
export const COGNITO_CLIENT_SECRET = getCognitoClientSecretId();
export const REFRESH_TOKEN_BEFORE_EOL_PERCENTAGE = 0.1;
