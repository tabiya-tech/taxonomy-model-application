import React, {createContext, useCallback, useEffect, useMemo} from "react";
import { useTokens } from "src/auth/hooks/useTokens";
import { useAuthUser } from "src/auth/hooks/useAuthUser";
import { AuthService } from "src/auth/services/AuthService";
import {AuthContextValue, AuthProviderProps, TExchangeCodeResponse} from "src/auth/auth.types";
import { AUTH_URL, COGNITO_CLIENT_ID, REDIRECT_URL } from "src/auth/constants";
import { AuthPersistentStorage } from "src/auth/services/AuthPersistentStorage";
import { getCodeQueryParam } from "src/auth/utils/getCodeQueryParam";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { Backdrop } from "src/theme/Backdrop/Backdrop";

export const authContextDefaultValue: AuthContextValue = {
  user: null,
  login: () => {},
  logout: () => {},
  hasRole: (role) => false,
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
  const { user, hasRole, setUser, updateUserByAccessToken } = useAuthUser()
  const tokens = useTokens({ updateUserByAccessToken });

  const [isExchangingCode, setIsExchangingCode] = React.useState(false);


  const isAuthenticating = useMemo(() => isExchangingCode || tokens.isAuthenticating, [isExchangingCode, tokens.isAuthenticating])

  async function exchangeCodeWithTokens(code: string, successCallback: (data: TExchangeCodeResponse) => void, errorCallback: (error: any) => void) {
    try {
      const authService = new AuthService();

      let data = await authService.exchangeCodeWithTokens(code)

      successCallback(data)
    } catch (error) {
      errorCallback(error)
    }
  }

  // this effect is responsible for exchanging the code with the tokens once after cognito redirects the user back to the app
  useEffect(() => {
    let code = getCodeQueryParam(window.location);

    if(code) {
      setIsExchangingCode(true)
      exchangeCodeWithTokens(code, data => {
        const { access_token, refresh_token } = data

        tokens.setAccessToken(access_token)
        tokens.setRefreshToken(refresh_token)

        updateUserByAccessToken(access_token)

        setIsExchangingCode(false)

        tokens.setIsAuthenticated(true)
      },() => {
        setIsExchangingCode(false)
        enqueueSnackbar("Failed to exchange provided code with tokens", { variant: "error" })
      })

      window.history.replaceState({}, document.title, "/");
    }
  }, [updateUserByAccessToken, tokens, enqueueSnackbar]);

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
  const logout = useCallback(() => {
    AuthPersistentStorage.clear()

    window.open(
      `${AUTH_URL}/logout?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=model-api%2Fmodel-api+openid&logout_uri=${encodeURIComponent(REDIRECT_URL)}/`,
      "_self"
    )

    tokens.clearTokens()
    setUser(null)
  }, [setUser, tokens])

  const value = useMemo(() => ({ user, login, logout, hasRole }), [hasRole, logout, user])

  return (
    <AuthContext.Provider value={value}>
      {isAuthenticating ?
        <Backdrop isShown={isAuthenticating} message={"Authenticating, wait a moment..."} />
        : children}
    </AuthContext.Provider>
  );
};

export * from "src/auth/auth.types"
