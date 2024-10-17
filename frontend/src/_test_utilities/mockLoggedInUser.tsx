import {
  AuthContextValue,
  TabiyaUser,
  authContextDefaultValue,
  AuthContext,
  AuthProviderProps,
} from "src/auth/AuthProvider";
import AuthAPISpecs from "api-specifications/auth";

export function mockLoggedInUser(mockedValues: Partial<AuthContextValue>) {
  let user: TabiyaUser = mockedValues.user || TestUsers.Anonymous;

  const value = {
    ...authContextDefaultValue,
    user: user,
    setUser: (user: TabiyaUser) => null,
    hasRole: (role: AuthAPISpecs.Enums.TabiyaRoles) => user.roles.includes(role),
    updateUserByAccessToken: () => {},
    ...mockedValues,
  };

  // @ts-ignore
  jest.spyOn(require("src/auth/AuthProvider"), "AuthProvider").mockImplementation((props: AuthProviderProps) => {
    return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
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
