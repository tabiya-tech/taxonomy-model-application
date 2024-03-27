import React, { createContext } from "react";

export enum TabiyaUserRole {
  ModelManager = "model-managers",
  AnonymousUser = "anonymous-users",
  RegisteredUser = "registered-users",
}

export type TabiyaUser = {
  username: string;
  roles: TabiyaUserRole[];
};

type AuthProviderProps = {
  children: React.ReactNode;
};

export type AuthContextValue = {
  user: TabiyaUser | null;
  login: () => void;
  logout: () => void;
  hasRole: (role: TabiyaUserRole) => boolean;
};

export const authContextDefaultValue: AuthContextValue = {
  user: null,
  login: () => {},
  logout: () => {},
  hasRole: () => false,
};

export const AuthContext = createContext<AuthContextValue>(authContextDefaultValue);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return <AuthContext.Provider value={authContextDefaultValue}>{children}</AuthContext.Provider>;
};
