import React, {createContext, useCallback, useEffect, useState} from "react";
import { Backdrop } from "../../theme/Backdrop/Backdrop";
import { useCookies } from "react-cookie";
import { jwtDecode } from "jwt-decode";

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

export type UserRoleContextValue = {
  user: TabiyaUser | null;
  login: () => void;
  logout: () => void;
  hasRole: (role: TabiyaUserRole) => boolean;
};

type TAccessTokenDetails = {
  'cognito:groups': TabiyaUserRole[];
}

type TIdentityTokenDetails = {
  'cognito:username': string;
}

export function getCodeQueryParam(location: Location | { search: string }) {
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get("code") ?? "";
}

export const AUTH_URL = "https://auth.dev.tabiya.tech"
export const REDIRECT_URL = window.location.origin
export const COGNITO_CLIENT_ID="77lkf19od35ss9r6kk4nn23kq7"
export const COGNITO_CLIENT_SECRET = "ncf1kt2jnpp45o5c9tjpo3ju1ip84b8a4f9dhbveuqmlteqjidt"
export const REFRESH_TOKEN_TIMEFRAME = 5 * 1000; // 5 seconds

export function userHasRoles(role: TabiyaUserRole, user: TabiyaUser | null): boolean {
  if(role === TabiyaUserRole.AnonymousUser) return !user;
  if(role === TabiyaUserRole.RegisteredUser) return !!user;
  if(!user) return false;

  return user.roles.includes(role);
}

export const AuthContext = createContext<UserRoleContextValue | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [cookies, setCookie, removeCookie] = useCookies(["authCookie", "nextRefreshTime", "accessToken", "refreshToken", "identityToken"]);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false)
  const [user, setUser] = useState<TabiyaUser | null>(null)

  const login = () => {
    const url = `${AUTH_URL}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=model-api%2Fmodel-api+openid&redirect_uri=${encodeURIComponent(REDIRECT_URL)}/`
    window.open(url, "_self")
  }

  const logout = () => {
    removeCookie("accessToken")
    removeCookie("refreshToken")
    removeCookie("identityToken")
    removeCookie("authCookie")

    window.open(
      `${AUTH_URL}/logout?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=model-api%2Fmodel-api+openid&redirect_uri=${encodeURIComponent(REDIRECT_URL)}/`,
      "_self"
    )
  }

  const exchangeCodeWithTokens = async (auth_code: string) => {
    setIsAuthenticating(true)

    try {
      const encodedAuthCode = encodeURIComponent(auth_code);
      const encodedRedirectUrl = encodeURIComponent(window.location.origin);
      const encodedClientId = encodeURIComponent(COGNITO_CLIENT_ID);
      const encodedClientSecret = encodeURIComponent(COGNITO_CLIENT_SECRET);
      const url = `${AUTH_URL}/oauth2/token?code=${encodedAuthCode}&grant_type=authorization_code&redirect_uri=${encodedRedirectUrl}/&client_id=${encodedClientId}`;

      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${window.btoa(`${encodedClientId}:${encodedClientSecret}`)}`,
      };

      let response = await fetch(url, {
        method: "POST",
        headers: headers,
      })

     return response.json();
    } catch (e: any) {

    }
  }

  function authenticateByToken({ identityToken, accessToken }: { identityToken: string, accessToken: string }) {
    try {
      const decodedIdentityToken = jwtDecode<TIdentityTokenDetails>(identityToken);
      const decodedAccessToken = jwtDecode<TAccessTokenDetails>(accessToken);

      setUser({
        username: decodedIdentityToken["cognito:username"],
        roles: decodedAccessToken["cognito:groups"],
      })
    } catch (e) {

    }
  }

  useEffect(() => {
    if(user) return;

    // User is already logged in
    if(cookies.identityToken && cookies.accessToken){
      authenticateByToken({ identityToken: cookies.identityToken, accessToken: cookies.accessToken })
      window.history.replaceState({}, document.title, window.location.origin+""+window.location.hash);
    } else {
      const code = getCodeQueryParam(window.location);

      if(code) {
        exchangeCodeWithTokens(code).then(data => {
          const { access_token, refresh_token, id_token, expires_in } = data;

          if(access_token) setCookie("accessToken", access_token);
          if(refresh_token) setCookie("refreshToken", refresh_token);
          if(id_token) setCookie("identityToken", id_token);
          if(expires_in) setCookie("nextRefreshTime", Date.now() + expires_in * 1000, { path: "/" })

          authenticateByToken({ identityToken: id_token, accessToken: access_token })

          setIsAuthenticating(false)
          window.history.replaceState({}, document.title, window.location.origin+""+window.location.hash);
        })
      }
    }

  }, [user, cookies.identityToken, cookies.accessToken, setCookie]);

  const refreshTokenHandler = async (nextRefreshTime: number, refreshToken: string) => {
    if(!refreshToken || refreshToken === "undefined") return;
    if(nextRefreshTime < Date.now()) {
      const encodedRefreshToken = encodeURIComponent(refreshToken);
      const encodedClientId = encodeURIComponent(COGNITO_CLIENT_ID);
      const encodedClientSecret = encodeURIComponent(COGNITO_CLIENT_SECRET);
      const url = `${AUTH_URL}/oauth2/token?refresh_token=${encodedRefreshToken}&grant_type=refresh_token&client_id=${encodedClientId}`;

      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${window.btoa(`${encodedClientId}:${encodedClientSecret}`)}`,
      };

      return fetch(url, {
        method: "POST",
        headers: headers,
      })
        .then((response) => response.json())
        .then((data) => {
          return data; // Return the data for further use if needed
        })
        .catch((_error) => {

        });
    }
  }

  const refreshToken = useCallback((nextRefreshTime: number , refreshToken: string) => {
    refreshTokenHandler(nextRefreshTime, refreshToken)
      .then(data => {
        if(!data) return;

        const { access_token, id_token, expires_in } = data;

        setCookie("accessToken", access_token);
        setCookie("identityToken", id_token);

        setCookie("nextRefreshTime", Date.now() + expires_in * 1000, { path: "/" })

        authenticateByToken({ identityToken: id_token, accessToken: access_token })

        setIsAuthenticating(false)
      })
  }, [setCookie])

  // Hook for refreshing token
  useEffect(() => {
    let intervalId: NodeJS.Timer;
    if(user && cookies.nextRefreshTime && cookies.nextRefreshTime > Date.now()) {
      intervalId = setInterval(() => refreshToken(cookies.nextRefreshTime, cookies.refreshToken), REFRESH_TOKEN_TIMEFRAME)
    } else if(cookies.nextRefreshTime < Date.now()) {
      refreshToken(cookies.nextRefreshTime, cookies.refreshToken);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [cookies.nextRefreshTime, cookies.refreshToken, refreshToken, user]);

  const authContextValue: UserRoleContextValue = {
    user: user,
    login,
    logout,
    hasRole: (role: TabiyaUserRole) => userHasRoles(role, user)
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
      <Backdrop isShown={isAuthenticating} message={"Hang on while we log you in ..."} />
    </AuthContext.Provider>
  );
};
