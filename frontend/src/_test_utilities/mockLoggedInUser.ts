import { AuthContextValue, TabiyaUser, authContextDefaultValue } from "src/auth/AuthProvider";
import AuthAPISpecs from "api-specifications/auth";

export function mockLoggedInUser(mockedValues: Partial<AuthContextValue>) {
  let user: TabiyaUser = mockedValues.user || TestUsers.Anonymous;
  jest.spyOn(require("src/auth/hooks/useAuthUser"), "useAuthUser").mockReturnValue({
    ...authContextDefaultValue,
    user: user,
    setUser: (user: TabiyaUser) => null,
    hasRole: (role: AuthAPISpecs.Enums.TabiyaRoles) => user.roles.includes(role),
    updateUserByAccessToken: () => {},
    ...mockedValues,
  });
}

export const TestUsers = {
  ModelManager: {
    username: "ModelManagerUser",
    roles: [AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER],
  },
  RegisteredUser: {
    username: "RegisteredUser",
    roles: [AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER],
  },
  Anonymous: {
    username: "AnonymousUser",
    roles: [AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS],
  },
};
