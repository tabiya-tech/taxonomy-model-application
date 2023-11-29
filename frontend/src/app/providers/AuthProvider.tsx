import React, {createContext, useEffect, useState} from "react";
import {useCookies} from "react-cookie";

interface ILocale {
  UUID: string;
  name: string;
  shortCode: string;
}

type UserRole = {
  isAdmin: boolean;
  isModelManager: boolean;
  modelManagerOf: ILocale[];
  isReadOnlyUser: boolean;
  isRegisteredUser: boolean; // this is the opposite of "isAnonymousUser", and it is the same as isAdmin || isModelManager || isReadOnlyUser
  isAnonymousUser: boolean; // this is synonymous with NOT(isRegisteredUser)
};

type AuthProviderProps = {
  children: React.ReactNode;
};

type UserRoleContextValue = {
  userRole: UserRole;
};

export const AuthContext = createContext<UserRoleContextValue | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [cookies, setCookie, removeCookie] = useCookies(['authCookie']);
  const [userRole, setUserRole] = useState<UserRole>({
    isAdmin: false,
    isModelManager: false,
    modelManagerOf: [],
    isRegisteredUser: false,
    isReadOnlyUser: false,
    isAnonymousUser: false,
  });
  useEffect(() => {
    // read the cookie and set the setUserRole
  }, [cookies.authCookie]);

  return <AuthContext.Provider value={{ userRole }}>{children}</AuthContext.Provider>;
};
