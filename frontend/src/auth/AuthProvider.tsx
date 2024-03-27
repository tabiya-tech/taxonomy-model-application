import React, {createContext, useEffect, useMemo} from "react";
import { useTokens } from "./hooks/useTokens";
import { useAuthUser } from "./hooks/useAuthUser";
import { AuthService } from "./services/AuthService";
import { AuthContextValue, AuthProviderProps } from "./auth.types";
import { AUTH_URL, COGNITO_CLIENT_ID, REDIRECT_URL } from "./constants";
import { AuthPersistentStorage } from "./services/AuthPersistentStorage";
import { getCodeQueryParam } from "./utils/getCodeQueryParam";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { Backdrop } from "../theme/Backdrop/Backdrop";

export const authContextDefaultValue: AuthContextValue = {
  user: null,
  login: () => {},
  logout: () => {},
  hasRole: () => false,
}

/**
 * AuthContext that provides the user, login, logout and hasRole functions
 */
export const AuthContext = createContext<AuthContextValue>(authContextDefaultValue);

/**
 * AuthProvider component that provides the AuthContext to the application
 * @param children
 * @constructor
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar()
  const { user, hasRole, updateUserByAccessToken } = useAuthUser()
  const tokens = useTokens();

  const [isExchangingCode, setIsExchangingCode] = React.useState(false);


  const isAuthenticating = useMemo(() => isExchangingCode || tokens.isAuthenticating, [isExchangingCode, tokens.isAuthenticating])

  useEffect(() => {
    let code = getCodeQueryParam(window.location);

    if(code) {
      setIsExchangingCode(true)
      const authService = new AuthService();
      authService.exchangeCodeWithTokens(code).then(data => {
        const { access_token, id_token, refresh_token } = data

        tokens.setAccessToken(access_token)
        tokens.setIdentityToken(id_token)
        tokens.setRefreshToken(refresh_token)

        updateUserByAccessToken(access_token)

        setIsExchangingCode(false)
      }).catch(() => {
        setIsExchangingCode(false)
        enqueueSnackbar("Failed to exchange provided code with tokens", { variant: "error" })
      })

      window.history.replaceState({}, document.title, "/");
    }
  }, [updateUserByAccessToken, tokens, enqueueSnackbar]);


  // update the user by the access token
  useEffect(() => {
    if(!user && tokens.accessToken) {
      updateUserByAccessToken(tokens.accessToken)
    }
  }, [user, tokens.accessToken, updateUserByAccessToken]);

  /**
   * redirects the user to the login url
   */
  const login = () => {
    const url = `${AUTH_URL}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=model-api%2Fmodel-api+openid&redirect_uri=${encodeURIComponent(REDIRECT_URL)}/`
    window.open(url, "_self")
  }

  /**
   * clears the refresh token and open the logout url
   * @returns void
   */
  const logout = () => {
    AuthPersistentStorage.clearRefreshToken()

    window.open(
      `${AUTH_URL}/logout?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=model-api%2Fmodel-api+openid&redirect_uri=${encodeURIComponent(REDIRECT_URL)}/`,
      "_self"
    )
  }

  const value = useMemo(() => ({ user, login, logout, hasRole }), [hasRole, user])

  return (
    <AuthContext.Provider value={value}>
      {isAuthenticating ?
        <Backdrop isShown={isAuthenticating} message={"Authenticating, wait a moment..."} />
        : children}
    </AuthContext.Provider>
  );
};

export * from "./auth.types";
