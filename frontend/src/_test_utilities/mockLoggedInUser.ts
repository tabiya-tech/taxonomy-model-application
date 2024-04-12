import { AuthContextValue, TabiyaUser, TabiyaUserRole, authContextDefaultValue } from "src/auth/AuthProvider";

export function mockLoggedInUser(mockedValues: Partial<AuthContextValue>){
  let user: TabiyaUser = mockedValues.user || { username: "foo", roles: [] };
  jest.spyOn(require("src/auth/hooks/useAuthUser"), "useAuthUser").mockReturnValue({
    ...authContextDefaultValue,
    user: user,
    setUser: (user: TabiyaUser) => null,
    hasRole: (role: TabiyaUserRole) => user.roles.includes(role),
    updateUserByAccessToken: () => {},
    ...mockedValues
  });
}
