import React, { createContext } from "react";

export enum TabiyaUserRole {
  ModelManager = "model-managers",
  AnonymousUser = "anonymous-users",
  RegisteredUser = "registered-users",
}

export type TabiyaUser = {
  firstName: string;
  lastName: string;
  roles: TabiyaUserRole[];
};

type AuthProviderProps = {
  children: React.ReactNode;
};

export type UserRoleContextValue = {
  user: TabiyaUser | null;
  login: () => void;
  logout: () => void;
  hasRole: (role: TabiyaUserRole) => boolean;
};

export const AuthContext = createContext<UserRoleContextValue | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authContextValue: UserRoleContextValue = {
    user: null,
    login: () => {},
    logout: () => {},
    hasRole: () => false,
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};
