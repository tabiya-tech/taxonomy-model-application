import React, { createContext } from "react";

export enum TabiyaUserRole {
  ModelManager = "model-managers",
  AnonymousUser = "anonymous-users",
  RegisteredUser = "registered-users",
}

export type TabiyaUser = {
  userName: string;
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

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authContextValue: AuthContextValue = {
    user: null,
    login: () => {},
    logout: () => {},
    hasRole: () => false,
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};
