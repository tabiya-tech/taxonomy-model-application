import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { TabiyaUser, TAccessTokenDetails } from "src/auth/auth.types";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import AuthAPISpecs from "api-specifications/auth";

/**
 * A hook to manage the user state
 * this hook was added to fullfill Single Responsability Principle, for now it is only used in authProvider
 * @returns TabiyaUser | null - The user
 */
export function useAuthUser() {
  const [user, setUser] = useState<TabiyaUser | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  /**
   * Checks if the user has the role provided
   * @returns boolean - If the user has the role
   * @param role - The role to check
   */
  const hasRole = (role: AuthAPISpecs.Enums.TabiyaRoles) => {
    // if no user is set, then the user is anonymous
    if (role === AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS) return user == null;
    if (!user) return false;

    // any user is a registered user
    if (role === AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER) return true;

    // check if the user has the role
    return user.roles.includes(role);
  };

  /**
   * Updates the user by the access token
   * @returns void
   * @param accessToken
   */
  const updateUserByAccessToken = (accessToken: string): void => {
    try {
      const decodedIdentityToken = jwtDecode<TAccessTokenDetails>(accessToken);

      const roles = [];

      if (decodedIdentityToken["cognito:groups"]) {
        roles.push(...decodedIdentityToken["cognito:groups"]);
      }

      setUser({
        username: decodedIdentityToken["username"],
        roles: roles,
      });
    } catch (error) {
      enqueueSnackbar("Invalid token", { variant: "error" });
    }
  };

  return {
    user,
    hasRole,
    setUser,
    updateUserByAccessToken,
  };
}
