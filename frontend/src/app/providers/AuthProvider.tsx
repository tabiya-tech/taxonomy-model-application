import React, {createContext, useEffect, useState} from "react";
import { useCookies } from "react-cookie";
import { useLocation } from "react-router-dom";
import { Backdrop } from "../../theme/Backdrop/Backdrop";
import { jwtDecode } from "jwt-decode";

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
  Admin = "admins-group",
  ModelManager = "model-managers-group",
  ReadOnlyUser = "read-only-users-group",
  RegisteredUser = "registered-users-group",
  AnonymousUser = "",
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
  logout: () => void;
};

function getCodeQueryParam() {
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get("code") ?? "";
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

const refreshAccessToken = (refreshToken: string) => {
  const encodedRefreshToken = encodeURIComponent(refreshToken);
  const encodedClientId = encodeURIComponent("77lkf19od35ss9r6kk4nn23kq7");
  const encodedClientSecret = encodeURIComponent("ncf1kt2jnpp45o5c9tjpo3ju1ip84b8a4f9dhbveuqmlteqjidt");
  const url = `https://auth.dev.tabiya.tech/oauth2/token?refresh_token=${encodedRefreshToken}&grant_type=refresh_token&client_id=${encodedClientId}`;
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
  const [cookies, setCookie, removeCookie] = useCookies(["authCookie", "accessToken", "refreshToken", "identityToken"]);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.AnonymousUser);
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
          const { access_token, refresh_token, id_token } = data;
          setCookie("accessToken", access_token);
          setCookie("refreshToken", refresh_token);
          setCookie("identityToken", id_token);
          const decodedToken = jwtDecode(id_token);
          console.log("Decoded Token:", decodedToken);
          // @ts-ignore
          setUserRole(decodedToken["cognito:groups"][0]);
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
  }, [cookies.authCookie, location, setCookie]);
  
  //periodically check if the access token is expired and refresh it
  useEffect(() => {
    const accessToken = cookies.accessToken;
    const refreshToken = cookies.refreshToken;
    const interval = setInterval(() => {
      if (accessToken) {
        const decodedToken = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;
        if (decodedToken && decodedToken.exp && decodedToken.exp < currentTime) {
          console.log("Access Token Expired. Refreshing ...");
          refreshAccessToken(refreshToken)
            .then((data: { access_token: any; refresh_token: any; id_token: any }) => {
              const { access_token, refresh_token, id_token } = data;
              setCookie("accessToken", access_token);
              setCookie("refreshToken", refresh_token);
              setCookie("identityToken", id_token);
              const decodedToken = jwtDecode(id_token);
              console.log("Decoded Token:", decodedToken);
              // @ts-ignore
              setUserRole(UserRole[decodedToken["cognito:groups"][0]]);
              // @ts-ignore
              console.log("user role:", UserRole[decodedToken["cognito:groups"][0]]);
            })
            .catch((error: any) => {
              console.error("Error:", error);
            });
        } else {
          console.log("Access Token is still valid");
          console.log("user role:", userRole);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [cookies.accessToken, cookies.refreshToken, setCookie, userRole]);

  // Handles user logout, clears cookies, and resets application state.
  const logout = () => {
    removeCookie("authCookie", { path: "/" });
    removeCookie("accessToken", { path: "/" });
    removeCookie("refreshToken", { path: "/" });
    setUserRole(UserRole.AnonymousUser);
    window.open(
      "https://auth.dev.tabiya.tech/logout?client_id=77lkf19od35ss9r6kk4nn23kq7&response_type=code&scope=model-api%2Fmodel-api+openid&redirect_uri=http%3A%2F%2Flocalhost%3A3000/",
      "_self"
    );
  };


  const authContextValue: UserRoleContextValue = {
    accessToken: cookies.accessToken,
    refreshToken: cookies.refreshToken,
    identityToken: cookies.identityToken,
    userRole,
    setCookie,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
      <Backdrop isShown={negotiating} message={"Hang on while we log you in ..."} />
    </AuthContext.Provider>
  );
};
