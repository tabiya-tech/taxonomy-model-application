import React, { createContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";

// interface ILocale {
//   UUID: string;
//   name: string;
//   shortCode: string;
// }

// export type UserRole = {
//   isAdmin: boolean;
//   isModelManager: boolean;
//   modelManagerOf: ILocale[];
//   isReadOnlyUser: boolean;
//   isRegisteredUser: boolean; // this is the opposite of "isAnonymousUser", and it is the same as isAdmin || isModelManager || isReadOnlyUser
//   isAnonymousUser: boolean; // this is synonymous with NOT(isRegisteredUser)
// };

export enum UserRole {
  Admin = "ADMIN",
  ModelManager = "MODEL_MANAGER",
  ReadOnlyUser = "READ_ONLY_USER",
  RegisteredUser = "REGISTERED_USER",
  AnonymousUser = "ANONYMOUS_USER",
}

type AuthProviderProps = {
  children: React.ReactNode;
};

export type UserRoleContextValue = {
  userRole: UserRole;
  setCookie: (name: "authCookie", value: string, options?: any) => void;
};

export const AuthContext = createContext<UserRoleContextValue | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [cookies, setCookie, removeCookie] = useCookies(["authCookie"]);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.AnonymousUser);

  useEffect(() => {
    const authCookie = cookies.authCookie;
    setUserRole(authCookie);
  }, [cookies.authCookie]);

  const authContextValue: UserRoleContextValue = {
    userRole,
    setCookie,
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};
