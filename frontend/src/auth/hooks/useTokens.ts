import { useCallback, useContext, useEffect, useState } from "react";
import { AuthPersistentStorage } from "../services/AuthPersistentStorage";
import { AuthService } from "../services/AuthService";
import { IsOnlineContext } from "../../app/providers";

type TUseTokensParams = {
  updateUserByAccessToken: (accessToken: string) => void;
};

/**
 * A hook to manage the tokens
 *  >  this hook was added to fullfill Single Responsability Principle, for now it is only used in authProvider
 * @returns tokens - The tokens
 */
export function useTokens({ updateUserByAccessToken }: TUseTokensParams) {
  const isOnline = useContext(IsOnlineContext);

  const [refreshToken, setRefreshToken] = useState("");

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const _setAccessToken = useCallback(
    (accessToken: string) => {
      updateUserByAccessToken(accessToken);
      AuthPersistentStorage.setAuthToken(accessToken);
    },
    [updateUserByAccessToken]
  );

  const handleRefreshToken = useCallback(async () => {
    if (isAuthenticated || isAuthenticating) return;

    const authService = new AuthService();
    const _refreshToken = AuthPersistentStorage.getRefreshToken();

    let timer: NodeJS.Timer | undefined;

    if (refreshToken || _refreshToken) {
      setIsAuthenticating(true);
      if (refreshToken !== _refreshToken) {
        setRefreshToken((refreshToken || _refreshToken) as string);
      }

      timer = await authService.initiateRefreshTokens(
        _refreshToken ?? refreshToken,
        (data) => {
          const { access_token } = data;

          _setAccessToken(access_token);
          setIsAuthenticating(false);

          setIsAuthenticated(true);
        },
        () => {
          setIsAuthenticating(false);
          setIsAuthenticated(false);
          AuthPersistentStorage.clear();
        }
      );
    }

    return timer;
  }, [refreshToken, _setAccessToken, isAuthenticated, isAuthenticating]);

  useEffect(() => {
    let timer: NodeJS.Timer | undefined;

    if (isOnline && !isAuthenticated) {
      handleRefreshToken().then((t) => (timer = t));
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOnline, handleRefreshToken, isAuthenticated]);

  const _setRefreshToken = (refreshToken: string) => {
    AuthPersistentStorage.setRefreshToken(refreshToken);
    setRefreshToken(refreshToken);
  };

  const clearTokens = () => {
    AuthPersistentStorage.clear();
    setRefreshToken("");
  };

  return {
    isAuthenticating,
    isAuthenticated,
    setIsAuthenticated,
    setAccessToken: _setAccessToken,
    refreshToken,
    setRefreshToken: _setRefreshToken,
    clearTokens,
  };
}

export const defaultUseTokensResponse: ReturnType<typeof useTokens> = {
  isAuthenticating: false,
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  setAccessToken: () => {},
  refreshToken: "",
  setRefreshToken: () => {},
  clearTokens: () => {},
};
