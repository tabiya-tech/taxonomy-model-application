import React, { createContext, useState } from "react";

interface ILocale {
  Ethiopia: string;
  SouthAfrica: string;
}

type UserRole = {
  isAdmin: boolean;
  isModelManager: boolean;
  modelManagerOf: ILocale[];
  isRegisteredUser: boolean;
  isReadOnlyUser: boolean;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

type UserRoleContextValue = {
  userRole: UserRole;
  setUserRole: React.Dispatch<React.SetStateAction<UserRole>>;
};

export const AuthContext = createContext<UserRoleContextValue | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>({
    isAdmin: false,
    isModelManager: false,
    modelManagerOf: [],
    isRegisteredUser: false,
    isReadOnlyUser: false,
  });

  return <AuthContext.Provider value={{ userRole, setUserRole }}>{children}</AuthContext.Provider>;
};
