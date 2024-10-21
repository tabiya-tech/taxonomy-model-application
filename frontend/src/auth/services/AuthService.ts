import { ErrorCodes } from "src/error/errorCodes";
import { getServiceErrorFactory, ServiceError } from "src/error/error";
import { TExchangeCodeResponse, TRefreshTokenResponse } from "src/auth/auth.types";
import {
  AUTH_URL,
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
  REFRESH_TOKEN_BEFORE_EOL_PERCENTAGE,
} from "src/auth/constants";

let isRefreshingTokens = false;

/**
 * Service for handling authentication
 */
export class AuthService {
  private static instance: AuthService;

  /**
   * Returns the instance of the AuthService
   * @returns AuthService
   */
  public static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Handles refreshing the tokens
   * @returns TRefreshTokenResponse
   * @param refreshToken
   */
  async handleRefreshingTokens(refreshToken: string): Promise<TRefreshTokenResponse> {
    const errorFactory = getServiceErrorFactory("AuthService", "handleRefreshingTokens", "POST", "");

    console.debug({
      message: "trying to refresh the tokens tokens",
      time_stamp: new Date(),
    });

    if (!refreshToken || refreshToken === "undefined")
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Invalid refresh token", new Error("Invalid Refresh Token"));

    const encodedRefreshToken = encodeURIComponent(refreshToken);
    const encodedClientId = encodeURIComponent(COGNITO_CLIENT_ID);
    const encodedClientSecret = encodeURIComponent(COGNITO_CLIENT_SECRET);
    const url = `${AUTH_URL}/oauth2/token?refresh_token=${encodedRefreshToken}&grant_type=refresh_token&client_id=${encodedClientId}`;

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + window.btoa(`${encodedClientId}:${encodedClientSecret}`),
    };

    let response = await fetch(url, {
      method: "POST",
      headers: headers,
    });

    if (response.status > 299 || response.status < 200)
      throw errorFactory(response.status, ErrorCodes.FAILED_TO_FETCH, "Failed to fetch", new Error("Failed to fetch"));

    return response.json();
  }

  /**
   * Exchanges the auth code with tokens from cognito
   * @param auth_code - The auth code to exchange in return of tokens
   * @returns TExchangeCodeResponse - The response from the cognito
   */
  async exchangeCodeWithTokens(auth_code: string): Promise<TExchangeCodeResponse> {
    const errorFactory = getServiceErrorFactory("AuthService", "exchangeCodeWithTokens", "POST", "");

    if (!auth_code || auth_code === "undefined")
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Invalid auth code", new Error("Invalid Auth Code"));

    const encodedAuthCode = encodeURIComponent(auth_code);
    const encodedRedirectUrl = encodeURIComponent(window.location.origin);
    const encodedClientId = encodeURIComponent(COGNITO_CLIENT_ID);
    const encodedClientSecret = encodeURIComponent(COGNITO_CLIENT_SECRET);
    const url = `${AUTH_URL}/oauth2/token?code=${encodedAuthCode}&grant_type=authorization_code&redirect_uri=${encodedRedirectUrl}/&client_id=${encodedClientId}`;

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + window.btoa(`${encodedClientId}:${encodedClientSecret}`),
    };

    let response = await fetch(url, {
      method: "POST",
      headers: headers,
    });

    return response.json();
  }

  /**
   * Initiates the refreshing of tokens
   * @param refreshToken
   * @param successCallback
   * @param unauthorizedCallback
   */
  async initiateRefreshTokens(
    refreshToken: string,
    successCallback: (data: TRefreshTokenResponse) => void,
    unauthorizedCallback: () => void
  ) {
    function handleEror(error: ServiceError) {
      if (error.statusCode >= 400 && error.statusCode < 500) {
        isRefreshingTokens = false;
        unauthorizedCallback();
      }
    }

    let data;
    try {
      data = await this.handleRefreshingTokens(refreshToken);
      successCallback(data);
      // Refresh when remaining 10% of the life-time
    } catch (error: any) {
      handleEror(error);
      return;
    }

    const MARGIN = data.expires_in * 1000 * REFRESH_TOKEN_BEFORE_EOL_PERCENTAGE;

    return setInterval(
      () => {
        if (isRefreshingTokens) return;

        isRefreshingTokens = true;

        this.handleRefreshingTokens(refreshToken)
          .then((data) => {
            isRefreshingTokens = false;
            successCallback(data);
          })
          .catch((error) => {
            handleEror(error);
          });
      },
      data.expires_in * 1000 - MARGIN
    );
  }
}
