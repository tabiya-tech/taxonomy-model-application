import React, { createContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useLocation } from "react-router-dom";
import { Backdrop } from "../../theme/Backdrop/Backdrop";

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
  accessToken: string;
  refreshToken: string;
  identityToken: string;
  userRole: UserRole;
  setCookie: (name: "authCookie", value: string, options?: any) => void;
};

function getCodeQueryParam() {
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get("code") || "";
}

function getLocation() {
  const location = window.location;
  return location.protocol + "//" + location.host + window.location.pathname;
}
function exchangeCodeWithTokens(auth_code: string) {
  const encodedAuthCode = encodeURIComponent(auth_code);
  const encodedRedirectUrl = encodeURIComponent(getLocation());
  const encodedClientId = encodeURIComponent("77lkf19od35ss9r6kk4nn23kq7");
  const encodedClientSecret = encodeURIComponent("ncf1kt2jnpp45o5c9tjpo3ju1ip84b8a4f9dhbveuqmlteqjidt");
  const url = `https://auth.dev.tabiya.tech/oauth2/token?code=${encodedAuthCode}&grant_type=authorization_code&redirect_uri=${encodedRedirectUrl}&client_id=${encodedClientId}`;
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${btoa(`${encodedClientId}:${encodedClientSecret}`)}`,
  };

  return fetch(url, {
    method: "POST",
    headers: headers,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Response Data:", data);
      return data; // Return the data for further use if needed
    })
    .catch((error) => {
      console.error("Error:", error);
      throw error;
    });
}
export const AuthContext = createContext<UserRoleContextValue | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [cookies, setCookie] = useCookies(["authCookie"]);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.AnonymousUser);
  //const [code, setCode] = useState<string>(getCodeQueryParam());
  const [negotiating, setNegotiating] = useState<boolean>(false);

  const location = useLocation();

  useEffect(() => {
    // Handle the code from the URL
    const code = getCodeQueryParam();
    if (code) {
      console.log("Code:", code);
      setNegotiating(true);
      exchangeCodeWithTokens(code)
        .then((data) => {
          // get user role from token
          setNegotiating(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          setNegotiating(false);
        });
      // After handling, remove the code from the URL
      window.history.replaceState({}, document.title, window.location.pathname + "#" + location.pathname);
    }

    const authCookie = cookies.authCookie;
    setUserRole(authCookie);
  }, [cookies.authCookie, location]);

  const authContextValue: UserRoleContextValue = {
    accessToken: "",
    refreshToken: "",
    identityToken: "",
    userRole,
    setCookie,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
      <Backdrop isShown={negotiating} message={"Hang on while we log you in ..."} />
    </AuthContext.Provider>
  );
};
