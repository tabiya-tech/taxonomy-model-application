import { useAuthUser } from "src/auth/hooks/useAuthUser";
import * as jwtDecodeUtils from "jwt-decode";
import { TabiyaUser } from "src/auth/auth.types";
import { renderHook, act } from "src/_test_utilities/test-utils";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import AuthAPISpecs from "api-specifications/auth";

const givenUser: TabiyaUser = {
  roles: [],
  username: "test",
};

// mock the snackbar
jest.mock("src/theme/SnackbarProvider/SnackbarProvider", () => {
  const actual = jest.requireActual("src/theme/SnackbarProvider/SnackbarProvider");
  return {
    ...actual,
    __esModule: true,
    useSnackbar: jest.fn().mockReturnValue({
      enqueueSnackbar: jest.fn(),
      closeSnackbar: jest.fn(),
    }),
  };
});

const jwtDecodeFn = jest.spyOn(jwtDecodeUtils, "jwtDecode");

describe("useAuthUser hook tests", () => {
  test("initially has no user", () => {
    // GIVEN: The hook is used in a component
    const { result } = renderHook(() => useAuthUser());

    // WHEN: Initially rendered
    // THEN: The user should be null - no user is set
    expect(result.current.user).toBeNull();
  });

  test("can set a user", () => {
    // GIVEN: The hook is used in a component
    const { result } = renderHook(() => useAuthUser());

    // WHEN: A user is set
    const testUser = givenUser;
    act(() => {
      result.current.setUser(testUser);
    });

    // THEN: The user is updated
    expect(result.current.user).toEqual(testUser);
  });

  test("correctly identifies an anonymous user", () => {
    // GIVEN: The hook is used and no user is set
    const { result } = renderHook(() => useAuthUser());

    // WHEN: Checking for an anonymous user
    const isAnonymous = result.current.hasRole(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS);

    // THEN: It should return true
    expect(isAnonymous).toBe(true);
  });

  test("correctly identifies a registered user", () => {
    const { result } = renderHook(() => useAuthUser());

    // GIVEN: A user is set
    const testUser = givenUser;
    act(() => {
      result.current.setUser(testUser);
    });

    // WHEN: Checking if the user is a registered user
    const isRegistered = result.current.hasRole(AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER);

    // THEN: It should return true
    expect(isRegistered).toBe(true);
  });

  test("correctly returns false when the user is null and the role is not AnonymousUser", () => {
    // GIVEN: The hook is used and no user is set
    const { result } = renderHook(() => useAuthUser());
    result.current.setUser(null);

    // WHEN: Checking for a role that is not AnonymousUser
    const isAnonymous = result.current.hasRole(AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER);
    const isModdelManager = result.current.hasRole(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

    // THEN: It should return false
    expect(isAnonymous).toBe(false);
    // AND: It should return false for the ModelManager role
    expect(isModdelManager).toBe(false);
  });

  test("correctly identifies a user with a specific role", () => {
    const { result } = renderHook(() => useAuthUser());

    // GIVEN: A user with a specific role is set
    const testUser = { ...givenUser, roles: [AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER] };

    act(() => {
      result.current.setUser(testUser);
    });

    // WHEN: Checking if the user has the Editor role
    const hasEditorRole = result.current.hasRole(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

    // THEN: It should return true
    expect(hasEditorRole).toBe(true);
  });

  test("returns false for a non-existent role on the user", () => {
    // GIVEN: A user with one role
    const testUser = givenUser;

    // AND the hook is used
    const { result } = renderHook(() => useAuthUser());

    // WHEHN the user is set
    act(() => {
      result.current.setUser(testUser);
    });

    // WHEN: Checking if the user has the anonymous role
    const hasAdminRole = result.current.hasRole(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS);

    // THEN: It should return false as the user does not have this role
    expect(hasAdminRole).toBe(false);
  });

  test("updating a new user to override the already existing user", () => {
    // GIVEN the hook is used
    const { result } = renderHook(() => useAuthUser());

    // AND user with username foo is in the state
    act(() => result.current.setUser({ username: "foo", roles: [] }));
    expect(result.current.user).toEqual({ username: "foo", roles: [] });

    // WHEN the user is updated
    act(() => result.current.setUser({ username: "bar", roles: [] }));

    // THEN the user should be updated
    expect(result.current.user).toEqual({ username: "bar", roles: [] });
  });

  describe("updateUserByAccessToken", () => {
    const userName = "test";
    const userRoles = [AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER];

    const user = {
      username: userName,
      roles: userRoles,
    };

    test("successful case", () => {
      jwtDecodeFn.mockReturnValue({ username: userName, "cognito:groups": userRoles });

      // GIVEN the hook is used
      const { result } = renderHook(() => useAuthUser());

      // AND No user is set
      expect(result.current.user).toBeNull();

      // WHEN the user is updated by an access token
      act(() => result.current.updateUserByAccessToken("foo"));

      // THEN the user should be updated
      expect(result.current.user).toEqual(user);
    });

    test("Invalid token provided", () => {
      jwtDecodeFn.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      // GIVEN the hook is used
      const { result } = renderHook(() => useAuthUser());

      // AND No user is set
      expect(result.current.user).toBeNull();

      // WHEN the user is updated by an access token
      act(() => result.current.updateUserByAccessToken("foo"));

      // THEN the user should be updated
      expect(result.current.user).toBeNull();

      // AND a notification should be shown
      expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith("Invalid token", { variant: "error" });
    });

    test("user with no roles provded", () => {
      jwtDecodeFn.mockReturnValue({ username: userName });

      // GIVEN the hook is used
      const { result } = renderHook(() => useAuthUser());

      // AND No user is set
      expect(result.current.user).toBeNull();

      // WHEN the user is updated by an access token
      act(() => result.current.updateUserByAccessToken("foo"));

      // THEN the user should be updated
      expect(result.current.user?.roles).toEqual([]);
      expect(result.current.user?.username).toEqual(userName);
    });
  });
});
