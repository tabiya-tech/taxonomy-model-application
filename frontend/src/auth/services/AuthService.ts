import { ErrorCodes } from "src/error/errorCodes";
import { getServiceErrorFactory } from "src/error/error";
import { TExchangeCodeResponse, TRefreshTokenResponse } from "../auth.types";
import { AUTH_URL, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET } from "src/auth/constants";

/**
 * Service for handling authentication
 */
export class AuthService {

  /**
   * Handles refreshing the tokens
   * @returns TRefreshTokenResponse
   * @param refreshToken
   */
  async handleRefreshingTokens(refreshToken: string): Promise<TRefreshTokenResponse> {
    const errorFactory = getServiceErrorFactory("AuthService", "handleRefreshingTokens", "POST","");

    if(!refreshToken || refreshToken === "undefined")
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Invalid refresh token", new Error("Invalid Refresh Token"));

    const encodedRefreshToken = encodeURIComponent(refreshToken);
    const encodedClientId = encodeURIComponent(COGNITO_CLIENT_ID);
    const encodedClientSecret = encodeURIComponent(COGNITO_CLIENT_SECRET);
    const url = `${AUTH_URL}/oauth2/token?refresh_token=${encodedRefreshToken}&grant_type=refresh_token&client_id=${encodedClientId}`;

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic "+window.btoa(`${encodedClientId}:${encodedClientSecret}`),
    };

    let response = await fetch(url, {
      method: "POST",
      headers: headers,
    })

    return response.json();
  }

  /**
   * Exchanges the auth code with tokens from cognito
   * @param auth_code - The auth code to exchange in return of tokens
   * @returns TExchangeCodeResponse - The response from the cognito
   */
  async exchangeCodeWithTokens (auth_code: string): Promise<TExchangeCodeResponse> {
    const errorFactory = getServiceErrorFactory("AuthService", "exchangeCodeWithTokens", "POST","");

    if(!auth_code || auth_code === "undefined")
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Invalid auth code", new Error("Invalid Auth Code"));

    const encodedAuthCode = encodeURIComponent(auth_code);
    const encodedRedirectUrl = encodeURIComponent(window.location.origin);
    const encodedClientId = encodeURIComponent(COGNITO_CLIENT_ID);
    const encodedClientSecret = encodeURIComponent(COGNITO_CLIENT_SECRET);
    const url = `${AUTH_URL}/oauth2/token?code=${encodedAuthCode}&grant_type=authorization_code&redirect_uri=${encodedRedirectUrl}/&client_id=${encodedClientId}`;

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic "+window.btoa(`${encodedClientId}:${encodedClientSecret}`),
    };

    let response = await fetch(url, {
      method: "POST",
      headers: headers,
    })

    return response.json();
  }

  /**
   * Initiates the refreshing of tokens
   * @param refreshToken
   * @param callback
   */
  async initiateRefreshTokens(refreshToken: string, callback: (data: any) => void) {
    let data = await this.handleRefreshingTokens(refreshToken);
    callback(data);

    return setInterval( () => {
      this.handleRefreshingTokens(refreshToken).then((data) => {
        callback(data)
      })
    }, data.expires_in * 1000)
  }
}
