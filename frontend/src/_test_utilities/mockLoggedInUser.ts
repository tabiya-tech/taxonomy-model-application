import { AuthContextValue, TabiyaUser, authContextDefaultValue } from "src/auth/AuthProvider";
import AuthAPISpecs from "api-specifications/auth";

export function mockLoggedInUser(mockedValues: Partial<AuthContextValue>) {
  let user: TabiyaUser = mockedValues.user || { username: "foo", roles: [] };
  jest.spyOn(require("src/auth/hooks/useAuthUser"), "useAuthUser").mockReturnValue({
    ...authContextDefaultValue,
    user: user,
    setUser: (user: TabiyaUser) => null,
    hasRole: (role: AuthAPISpecs.Enums.TabiyaRoles) => user.roles.includes(role),
    updateUserByAccessToken: () => {},
    ...mockedValues,
  });
}
