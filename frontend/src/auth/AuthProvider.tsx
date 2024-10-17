import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";

import { AuthService } from "src/auth/services/AuthService";
import { AuthContextValue, AuthProviderProps, TabiyaUser, TAccessTokenDetails } from "src/auth/auth.types";
import { AUTH_URL, COGNITO_CLIENT_ID, REDIRECT_URL } from "src/auth/constants";
import { AuthPersistentStorage } from "src/auth/services/AuthPersistentStorage";
import { getCodeQueryParam } from "src/auth/utils/getCodeQueryParam";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { Backdrop } from "src/theme/Backdrop/Backdrop";

import AuthAPISpecs from "api-specifications/auth";
import { IsOnlineContext } from "src/app/providers";
import { jwtDecode } from "jwt-decode";

export const authContextDefaultValue: AuthContextValue = {
  user: null,
  login: () => {},
  logout: () => {},
  hasRole: (_role) => false,
};

/**
 * AuthContext that provides the user, login, logout and hasRole functions
 */
export const AuthContext = createContext<AuthContextValue>(authContextDefaultValue);

/**
 * AuthProvider component that provides the AuthContext to the application
 * @param children - the children components
 * @returns JSX.Element - the param wrapped in the AuthContext.Provider with the value of the user, login, logout and hasRole functions
 * @constructor
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const isOnline = useContext(IsOnlineContext);
  const { enqueueSnackbar } = useSnackbar();

  const [user, setUser] = React.useState<TabiyaUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  /**
   * Handles the access token by setting it in the local storage and setting the user
   * This function is called when the access_token is changed
   * @param access_token - The access token to handle
   */
  const handleAccessToken = useCallback(
    (access_token: string) => {
      try {
        AuthPersistentStorage.setAuthToken(access_token);

        const decodedIdentityToken = jwtDecode<TAccessTokenDetails>(access_token);

        const roles = [];

        if (decodedIdentityToken["cognito:groups"]) {
          roles.push(...decodedIdentityToken["cognito:groups"]);
        }

        const userDetails = {
          username: decodedIdentityToken["username"],
          roles: roles,
        };

        setUser(userDetails);
      } catch (e) {
        setUser(null);
        enqueueSnackbar("Failed to decode the access token", { variant: "error" });
        AuthPersistentStorage.clear();
      }
    },
    [enqueueSnackbar]
  );

  /**
   * Initiates the token refreshing by calling the AuthService's initiateRefreshTokens function
   *
   * This function should be called whenever the access token is expired and the refresh token is still valid
   *
   * It might throw an error if the refreshing fails, in that case, it clears the tokens and sets the user as not authenticated
   * examples:
   *  - like if the refresh token is invalid/has-expired we have to log out the user on the device.
   *
   * @param refreshToken - The refresh token to use to refresh the tokens
   * @returns Promise<NodeJS.Timer | undefined> - The timer that is set to refresh the tokens
   */
  const initiateTokenRefreshing = useCallback(
    async (refreshToken: string) => {
      let timer: NodeJS.Timer | undefined;

      try {
        const authService = AuthService.getInstance();

        setIsAuthenticating(true);

        timer = await authService.initiateRefreshTokens(
          refreshToken,
          (data) => {
            const { access_token } = data;

            handleAccessToken(access_token);
            setIsAuthenticating(false);
          },
          () => {
            setIsAuthenticating(false);
            AuthPersistentStorage.clear();
          }
        );
      } catch (e) {
        // If the refreshing fails, clear the tokens and set user as not authenticated
        AuthPersistentStorage.clear();
        setIsAuthenticating(false);
        setUser(null);
      }

      AuthPersistentStorage.setRefreshToken(refreshToken);
      return timer;
    },
    [handleAccessToken]
  );

  /**
   * useEffect that runs when the component is mounted
   * This useEffect is responsible for handling the code query param and exchanging it with the tokens
   * It also initiates the token refreshing
   *
   * It is run when cognito redirects the user back to the application with the code query param
   *
   * After it handles the code query param, it initiates the token refreshing so that the user can stay authenticated for some time.
   */
  useEffect(() => {
    let timer: Promise<NodeJS.Timer | undefined> | undefined;
    let code = getCodeQueryParam(window.location);
    const authService = AuthService.getInstance();

    if (code) {
      setIsAuthenticating(true);
      authService
        .exchangeCodeWithTokens(code)
        .then((data) => {
          const { access_token, refresh_token } = data;
          handleAccessToken(access_token);
          timer = initiateTokenRefreshing(refresh_token);
        })
        .catch((_error) => {
          setIsAuthenticating(false);
          enqueueSnackbar("Failed to exchange provided code with tokens", { variant: "error" });
        });

      window.history.replaceState({}, document.title, "/");
    }

    return () => {
      if (timer) {
        timer.then((t) => {
          if (t) clearInterval(t);
        });
      }
    };
  }, [enqueueSnackbar, handleAccessToken, initiateTokenRefreshing]);

  /**
   * useEffect that runs when the component is mounted
   * This useEffect is responsible for initiating the token refreshing when the user is online and the refresh token is available
   * It also clears the timer when the component is unmounted
   * It is run when the user is online and the refresh token is available
   */
  useEffect(() => {
    let timer: Promise<NodeJS.Timer | undefined> | undefined;

    const _refreshToken = AuthPersistentStorage.getRefreshToken();

    if (isOnline && _refreshToken) {
      timer = initiateTokenRefreshing(_refreshToken);
    }

    return () => {
      if (timer) {
        timer.then((t) => {
          if (t) clearInterval(t);
        });
      }
    };
  }, [initiateTokenRefreshing, isOnline]);

  /**
   * redirects the user to the login url
   */
  const login = () => {
    const url = `${AUTH_URL}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(
      REDIRECT_URL
    )}/`;
    window.open(url, "_self");
  };

  /**
   * clears the refresh token and open the logout url
   * @returns void
   */
  const logout = useCallback(() => {
    AuthPersistentStorage.clear();

    window.open(
      `${AUTH_URL}/logout?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=email+openid+profile&logout_uri=${encodeURIComponent(
        REDIRECT_URL
      )}/`,
      "_self"
    );
    setUser(null);
  }, [setUser]);

  /**
   * Checks if the user has the role provided
   * @returns boolean - If the user has the role
   * @param role - The role to check
   */
  const hasRole = useCallback(
    (role: AuthAPISpecs.Enums.TabiyaRoles) => {
      // if no user is set, then the user is anonymous
      if (role === AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS) return user == null;
      if (!user) return false;

      // any user is a registered user
      if (role === AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER) return true;

      // check if the user has the role
      return user.roles.includes(role);
    },
    [user]
  );

  const value = useMemo(() => ({ user, login, logout, hasRole }), [hasRole, logout, user]);

  return (
    <AuthContext.Provider value={value}>
      {isAuthenticating ? (
        <Backdrop isShown={isAuthenticating} message={"Authenticating, wait a moment..."} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export * from "src/auth/auth.types";
