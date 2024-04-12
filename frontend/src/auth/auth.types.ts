import React from "react";

export enum TabiyaUserRole {
  ModelManager = "model-managers",
  AnonymousUser = "anonymous-users",
  RegisteredUser = "registered-users",
}

export type TabiyaUser = {
  username: string;
  roles: TabiyaUserRole[];
};

export type AuthProviderProps = {
  children: React.ReactNode;
};

export type AuthContextValue = {
  user: TabiyaUser | null;
  login: () => void;
  logout: () => void;
  hasRole: (role: TabiyaUserRole) => boolean;
};

export type TAccessTokenDetails = {
  'username': string;
  'cognito:groups': TabiyaUserRole[];
}

/**
 * The response from the cognito when refreshing the tokens
 */
export type TRefreshTokenResponse = {
  expires_in: number;
  access_token: string;
  id_token: string;
}

/**
 * The response from the cognito when exchanging the auth code with tokens
 */
export type TExchangeCodeResponse = TRefreshTokenResponse & {
  refresh_token: string;
}
