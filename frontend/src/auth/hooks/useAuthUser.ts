import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { TabiyaUser, TabiyaUserRole, TAccessTokenDetails } from "src/auth/auth.types";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";

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
  const hasRole = (role: TabiyaUserRole) => {
    // if no user is set, then the user is anonymous
    if (role === TabiyaUserRole.AnonymousUser) return user == null;
    if (!user) return false;

    // any user is a registered user
    if (role === TabiyaUserRole.RegisteredUser) return true;

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

      setUser({
        username: decodedIdentityToken["username"],
        roles: decodedIdentityToken["cognito:groups"],
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
