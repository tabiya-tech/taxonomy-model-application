import {useCallback, useContext, useEffect, useState} from "react";
import { AuthPersistentStorage } from "../services/AuthPersistentStorage";
import { AuthService } from "../services/AuthService";
import {IsOnlineContext} from "../../app/providers";

export function useTokens() {
  const isOnline = useContext(IsOnlineContext)

  const [identityToken, setIdentityToken] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");
  const [refreshToken, setRefreshToken] = useState("");

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleRefreshToken = useCallback(async () => {
    if(isAuthenticated || isAuthenticating) return;

    const authService = new AuthService();
    const _refreshToken = AuthPersistentStorage.getRefreshToken();

    let timer: NodeJS.Timer | undefined;

    if((refreshToken || _refreshToken)) {
      setIsAuthenticating(true)
      if(refreshToken !== _refreshToken) {
        setRefreshToken((refreshToken || _refreshToken) as string);
      }

      timer = await authService.initiateRefreshTokens(_refreshToken ?? refreshToken, (data) => {
        const { access_token, id_token } = data;

        setAccessToken(access_token);
        setIdentityToken(id_token);
        setIsAuthenticating(false);

        setIsAuthenticated(true)
      })
    }

    return timer;
  }, [refreshToken, isAuthenticated, isAuthenticating])

  useEffect(() => {
    let timer: NodeJS.Timer | undefined

    if(isOnline && !isAuthenticated) {
      handleRefreshToken().then((t) => timer = t);
    }

    return () => {
      if(timer) clearInterval(timer);
    }
  }, [isOnline, handleRefreshToken, isAuthenticated])

  const _setRefreshToken = (refreshToken: string) => {
    AuthPersistentStorage.setRefreshToken(refreshToken);
    setRefreshToken(refreshToken);
  };

  return {
    isAuthenticating,
    identityToken,
    setIdentityToken,
    accessToken,
    setAccessToken,
    refreshToken,
    setRefreshToken: _setRefreshToken,
  };
}
