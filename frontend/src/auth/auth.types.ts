import React from "react";
import AuthAPISpecs from "api-specifications/auth";

export type TabiyaUser = {
  username: string;
  roles: AuthAPISpecs.Enums.TabiyaRoles[];
};

export type AuthProviderProps = {
  children: React.ReactNode;
};

export type AuthContextValue = {
  user: TabiyaUser | null;
  login: () => void;
  logout: () => void;
  hasRole: (role: AuthAPISpecs.Enums.TabiyaRoles) => boolean;
};

export type TAccessTokenDetails = {
  username: string;
  "cognito:groups": AuthAPISpecs.Enums.TabiyaRoles[];
};

/**
 * The response from the cognito when refreshing the tokens
 */
export type TRefreshTokenResponse = {
  expires_in: number;
  access_token: string;
  id_token: string;
};

/**
 * The response from the cognito when exchanging the auth code with tokens
 */
export type TExchangeCodeResponse = TRefreshTokenResponse & {
  refresh_token: string;
};
