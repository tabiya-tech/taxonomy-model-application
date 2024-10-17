// mute the console
import "src/_test_utilities/consoleMock";

import { useContext } from "react";

import AuthAPISpecs from "api-specifications/auth";
import { AuthService } from "src/auth/services/AuthService";
import * as JWTDecodeModule from "jwt-decode";
import { AUTH_URL, COGNITO_CLIENT_ID } from "src/auth/constants";
import * as getCodeQueryParam from "src/auth/utils/getCodeQueryParam";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { mockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";
import { DATA_TEST_ID as BACKDROP_TEST_IDS } from "src/theme/Backdrop/Backdrop";
import { AuthPersistentStorage } from "src/auth/services/AuthPersistentStorage";
import { act, render, renderHook, screen, waitFor } from "src/_test_utilities/test-utils";
import { AuthContext, authContextDefaultValue, AuthProvider, TabiyaUser } from "src/auth/AuthProvider";

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

jest.spyOn(global, "clearInterval");

const TabiyaRoles = AuthAPISpecs.Enums.TabiyaRoles;

const open = jest.spyOn(window, "open").mockReturnValue(null);
const exchangeCodeWithTokens = jest.spyOn(AuthService.prototype, "exchangeCodeWithTokens");
const initiateRefreshTokens = jest.spyOn(AuthService.prototype, "initiateRefreshTokens");
const jwtDecode = jest.spyOn(JWTDecodeModule, "jwtDecode");

const renderAuthContext = () => renderHook(() => useContext(AuthContext));

const mockLoggedInUser = (user?: TabiyaUser | null) => {
  mockBrowserIsOnLine(true);
  if (!user) {
    AuthPersistentStorage.clearRefreshToken();
    return;
  } else {
    AuthPersistentStorage.setRefreshToken("test-token");
  }

  act(() => {
    initiateRefreshTokens.mockImplementation(async (_refreshToken, successCallback, _failureCallback) => {
      successCallback({
        access_token: "test-access-token",
        id_token: "test-id-token",
        expires_in: 3600,
      });

      return setInterval(() => {
        successCallback({
          access_token: "test-access token",
          id_token: "test-id-token",
          expires_in: 3600,
        });
      });
    });

    jwtDecode.mockReturnValue({
      username: user?.username,
      "cognito:groups": user.roles,
    });
  });
};

const ANONYMOUS_USER = null;

const REGISTERED_USER = {
  username: "registered-user",
  roles: [],
};

const MODEL_MANAGER = {
  username: "model-manager",
  roles: [TabiyaRoles.MODEL_MANAGER],
};

describe("AuthProvider - Render tests", () => {
  it("should render the passed children", () => {
    // GIVEN some sample child element
    const givenDataTestId = "test-id";
    const givenChildElement = <div data-testid={givenDataTestId}>Test</div>;

    // WHEN the AuthProvider is rendered with the given child element
    const { container } = render(<AuthProvider>{givenChildElement}</AuthProvider>);

    // THEN the child element should be rendered
    const childElement = screen.getByTestId(givenDataTestId);

    expect(childElement).toBeInTheDocument();

    // AND container should match the snapshot
    expect(container).toMatchSnapshot();
  });

  it("should render a backdrop when the authenticating is in the middle of the process", () => {
    // GIVEN that there is some token/user is authenticated
    AuthPersistentStorage.setRefreshToken("test-token");

    // WHEN the AuthProvider is rendered
    const { container } = render(<AuthProvider>Test</AuthProvider>);

    // THEN a backdrop should be rendered/in document
    const BackdropComponent = screen.getByTestId(BACKDROP_TEST_IDS.BACKDROP_CONTAINER);
    expect(BackdropComponent).toBeInTheDocument();

    // AND container should match the snapshot
    expect(container).toMatchSnapshot();
  });
});

describe("Auth Context", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
    jest.useFakeTimers({
      advanceTimers: true,
    }); // Use Jest's fake timers
  });

  afterAll(() => {
    jest.useRealTimers(); // Use real timers after all tests
    jest.clearAllMocks(); // Clear all mocks after each test
    jest.runOnlyPendingTimers();
  });

  describe("Auth Context - value", () => {
    test("should return the expected values", () => {
      // GIVEN: The Auth Provider is rendered and auth context is accessed
      const { result } = renderAuthContext();

      // THEN: The value should be as expected
      expect(result.current).toBeDefined();
      expect(result.current.user).toBeNull();
      expect(result.current.login).toBeDefined();
      expect(result.current.logout).toBeDefined();
      expect(result.current.hasRole).toBeDefined();
    });
  });

  describe("Auth Context - hasRole", () => {
    test.each([
      [TabiyaRoles.ANONYMOUS, ANONYMOUS_USER, true],
      [TabiyaRoles.ANONYMOUS, REGISTERED_USER, false],
      [TabiyaRoles.ANONYMOUS, MODEL_MANAGER, false],

      [TabiyaRoles.REGISTERED_USER, ANONYMOUS_USER, false],
      [TabiyaRoles.REGISTERED_USER, REGISTERED_USER, true],
      [TabiyaRoles.REGISTERED_USER, MODEL_MANAGER, true],

      [TabiyaRoles.MODEL_MANAGER, MODEL_MANAGER, true],
      [TabiyaRoles.MODEL_MANAGER, ANONYMOUS_USER, false],
      [TabiyaRoles.MODEL_MANAGER, REGISTERED_USER, false],
    ])("should return the expected value for %s role", (role, user, expected) => {
      jest.clearAllMocks();

      // AND the user is set
      mockLoggedInUser(user);

      // GIVEN: The Auth Provider is rendered and auth context is accessed
      const { result } = renderAuthContext();

      // THEN: The hasRole function should return the expected value
      expect(result.current.hasRole(role)).toBe(expected);
    });
  });

  describe("Initiating refresh token when the user refreshes the page", () => {
    test("it should not initiate refresh token when the user is offline", () => {
      // GIVEN the user is offline
      mockBrowserIsOnLine(false);

      // WHEN the AuthProvider is rendered
      render(<AuthProvider>Test</AuthProvider>);

      // THEN the refresh token should not be initiated
      expect(initiateRefreshTokens).not.toHaveBeenCalled();
    });

    test("it should not call initiateRefreshTokens when there is no refresh token in storage", () => {
      // GIVEN the user is online
      mockBrowserIsOnLine(true);

      // AND there is no refresh token in storage
      AuthPersistentStorage.clearRefreshToken();

      // WHEN the AuthProvider is rendered
      render(<AuthProvider>Test</AuthProvider>);

      // THEN the refresh token should not be initiated
      expect(initiateRefreshTokens).not.toHaveBeenCalled();
    });

    test("it should call initiateRefreshTokens when the user is online and there is a refresh token in storage", () => {
      // GIVEN there is a refresh token in storage
      const givenToken = "foo-test-token";
      AuthPersistentStorage.setRefreshToken(givenToken);
      // AND user is online
      mockBrowserIsOnLine(true);

      // WHEN the AuthProvider is rendered
      render(<AuthProvider>Test</AuthProvider>);

      // THEN the refresh token should be initiated
      expect(initiateRefreshTokens).toHaveBeenCalledWith(givenToken, expect.any(Function), expect.any(Function));
    });

    test("it should clear the timer when the AuthProvider is unmounted", async () => {
      const clearSpy = jest.spyOn(global, "clearInterval");
      // GIVEN the user is online and there is a refresh token in storage
      const givenToken = "foo-test-token";
      mockBrowserIsOnLine(true);
      AuthPersistentStorage.setRefreshToken(givenToken);

      // AND a timer will be returned.
      const timer = 1 as unknown as NodeJS.Timeout;

      // @ts-ignore
      initiateRefreshTokens.mockResolvedValue(timer);

      // WHEN the AuthProvider is rendered
      const { unmount } = render(<AuthProvider>Test</AuthProvider>);

      // AND the AuthProvider is unmounted
      act(() => unmount());

      await Promise.resolve(); // Wait for all promises to resolve

      // THEN the timer should be cleared
      await waitFor(() => {
        expect(clearSpy).toHaveBeenCalledWith(timer);
      });
    });

    test("it should not clear the timer when no timer is returned", async () => {
      // GIVEN the user is online and there is a refresh token in storage
      const givenToken = "foo-test-token";
      mockBrowserIsOnLine(true);
      AuthPersistentStorage.setRefreshToken(givenToken);

      // AND a timer will be returned.
      const timer = null as unknown as NodeJS.Timeout;
      const clearSpy = jest.spyOn(global, "clearInterval");

      // @ts-ignore
      initiateRefreshTokens.mockResolvedValue(timer);

      // WHEN the AuthProvider is rendered
      const { unmount } = render(<AuthProvider>Test</AuthProvider>);

      // AND the AuthProvider is unmounted
      act(() => unmount());

      await Promise.resolve(); // Wait for all promises to resolve

      // THEN the timer should be cleared
      await waitFor(() => {
        expect(clearSpy).not.toHaveBeenCalledWith(timer);
      });
    });

    it("should log user out when the refresh token is invalid", async () => {
      const clear = jest.spyOn(AuthPersistentStorage, "clear");

      // GIVEN we have in invalid refresh token
      const givenInvalidToken = "invalid-token";
      AuthPersistentStorage.setRefreshToken(givenInvalidToken);

      // AND user is online
      mockBrowserIsOnLine(true);

      // AND the refresh token is invalid
      initiateRefreshTokens.mockRejectedValue(new Error("Invalid refresh token"));

      // WHEN the context is rendered
      const { result } = renderAuthContext();

      await Promise.resolve(); // Wait for all promises to resolve

      // THEN the user should be logged out
      await waitFor(() => {
        expect(clear).toHaveBeenCalled();
      });

      expect(result.current.user).toBeNull();
    });

    it("should log user out when the initiateRefreshTokens calls failureCallback", async () => {
      const clear = jest.spyOn(AuthPersistentStorage, "clear");

      // GIVEN we have in invalid refresh token
      const givenInvalidToken = "invalid-token";
      AuthPersistentStorage.setRefreshToken(givenInvalidToken);

      // AND user is online
      mockBrowserIsOnLine(true);

      // AND the refresh token is invalid
      initiateRefreshTokens.mockImplementation(async (_refreshToken, _successCallback, failureCallback) => {
        failureCallback();
        return undefined;
      });

      // WHEN the context is rendered
      const { result } = renderAuthContext();

      await Promise.resolve(); // Wait for all promises to resolve

      // THEN the user should be logged out
      await waitFor(() => {
        expect(clear).toHaveBeenCalled();
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe("Login functionality", () => {
    test("should call the login url with the correct parameters", () => {
      // GIVEN: The Auth Provider is rendered and auth context is accessed
      const { result } = renderAuthContext();

      // WHEN the login function is called
      result.current?.login();

      // THEN: The window should be redirected to the login url
      // AND the url should contain the correct parameters
      expect(open).toHaveBeenCalledWith(
        `${AUTH_URL}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(
          window.location.origin
        )}/`,
        `_self`
      );
    });
  });

  describe("Logout functionality", () => {
    test("should redirect to the correct login url with the correct parameters", () => {
      // GIVEN: The Auth Provider is rendered and auth context is accessed
      const { result } = renderAuthContext();

      // WHEN the logout function is called
      act(() => result.current?.logout());

      // THEN: The window should be redirected to the login url
      expect(open).toHaveBeenCalled();
      // AND the url should contain the correct parameters
      expect(open).toHaveBeenCalledWith(
        `${AUTH_URL}/logout?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=email+openid+profile&logout_uri=${encodeURIComponent(
          window.location.origin
        )}/`,
        `_self`
      );
    });

    test("it should clear the refresh token when the logout function is called", async () => {
      // GIVEN the Auth Provider is rendered and auth context is accessed
      mockLoggedInUser(REGISTERED_USER);
      const { result, rerender } = renderAuthContext();

      // AND the user is online.
      mockBrowserIsOnLine(true);

      rerender();

      // WHEN the logout function is called
      act(() => result.current?.logout());

      // THEN the refresh token should be cleared
      expect(AuthPersistentStorage.getRefreshToken()).toBeNull();

      // AND the clear function should be called
      expect(AuthPersistentStorage.getAuthToken()).toBeNull();

      // AND the user should be null
      expect(result.current.user).toBeNull();
    });
  });

  describe("handleAccessToken", () => {
    it("should call jwtDecode to decode the returned access token", () => {
      // Register spys.
      const setAuthToken = jest.spyOn(AuthPersistentStorage, "setAuthToken");
      const clear = jest.spyOn(AuthPersistentStorage, "clear");

      // GIVEN: a valid access token
      const givenAccessToken = "valid-access-token";

      const givenDecodedUser = {
        username: "test-username",
        "cognito:groups": ["test-role"],
      };

      // AND the user is online.
      mockBrowserIsOnLine(true);

      // AND we have a valid refresh token
      AuthPersistentStorage.setRefreshToken("foo");

      jwtDecode.mockReturnValue(givenDecodedUser);

      initiateRefreshTokens.mockImplementation(async (_refreshToken, successCallback, _failureCallback) => {
        successCallback({
          access_token: givenAccessToken,
          id_token: "test-id-token",
          expires_in: 3600,
        });

        return setInterval(() => {
          successCallback({
            access_token: givenAccessToken,
            id_token: "test-id-token",
            expires_in: 3600,
          });
        });
      });

      // WHEN: Context is called with the access token
      const { result } = renderAuthContext();

      // THEN: jwtDecode should be called with the access token
      expect(jwtDecode).toHaveBeenCalledWith(givenAccessToken);

      // AND: AuthPersistentStorage.setAuthToken should be called with the access token
      expect(setAuthToken).toHaveBeenCalledWith(givenAccessToken);

      // AND: the user should be set with the decoded token details
      expect(result.current.user).toEqual({
        username: givenDecodedUser.username,
        roles: givenDecodedUser["cognito:groups"],
      });

      // AND: AuthPersistentStorage.clear should not be called
      expect(clear).not.toHaveBeenCalled();
    });

    it("should log user out if jwtDecode fails", () => {
      // Register spys.
      const clear = jest.spyOn(AuthPersistentStorage, "clear");

      // GIVEN: a valid access token
      const givenAccessToken = "valid-access-token";

      // AND the user is online.
      mockBrowserIsOnLine(true);

      // AND we have a valid refresh token
      AuthPersistentStorage.setRefreshToken("foo");

      jwtDecode.mockImplementation(() => {
        throw new Error("Failed to decode access token");
      });

      initiateRefreshTokens.mockImplementation(async (_refreshToken, successCallback, _failureCallback) => {
        successCallback({
          access_token: givenAccessToken,
          id_token: "test-id-token",
          expires_in: 3600,
        });

        return setInterval(() => {
          successCallback({
            access_token: givenAccessToken,
            id_token: "test-id-token",
            expires_in: 3600,
          });
        });
      });

      // WHEN: Context is called with the access token
      const { result } = renderAuthContext();

      // THEN: jwtDecode should be called with the access token
      expect(jwtDecode).toHaveBeenCalledWith(givenAccessToken);

      // AND: the user should be null
      expect(result.current.user).toBeNull();

      // AND: AuthPersistentStorage.clear should be called
      expect(clear).toHaveBeenCalled();
    });
    it("should return an empty array if user has no cognito:groups", () => {
      // Register spys.
      const setAuthToken = jest.spyOn(AuthPersistentStorage, "setAuthToken");
      const clear = jest.spyOn(AuthPersistentStorage, "clear");

      // GIVEN: a valid access token
      const givenAccessToken = "valid-access-token";

      const givenDecodedUser = {
        username: "test-username",
      };

      // AND the user is online.
      mockBrowserIsOnLine(true);

      // AND we have a valid refresh token
      AuthPersistentStorage.setRefreshToken("foo");

      jwtDecode.mockReturnValue(givenDecodedUser);

      initiateRefreshTokens.mockImplementation(async (_refreshToken, successCallback, _failureCallback) => {
        successCallback({
          access_token: givenAccessToken,
          id_token: "test-id-token",
          expires_in: 3600,
        });

        return setInterval(() => {
          successCallback({
            access_token: givenAccessToken,
            id_token: "test-id-token",
            expires_in: 3600,
          });
        });
      });

      // WHEN: Context is called with the access token
      const { result } = renderAuthContext();

      // THEN: jwtDecode should be called with the access token
      expect(jwtDecode).toHaveBeenCalledWith(givenAccessToken);

      // AND: AuthPersistentStorage.setAuthToken should be called with the access token
      expect(setAuthToken).toHaveBeenCalledWith(givenAccessToken);

      // AND: the user should be set with the decoded token details
      expect(result.current.user).toEqual({
        username: givenDecodedUser.username,
        roles: [],
      });

      // AND: AuthPersistentStorage.clear should not be called
      expect(clear).not.toHaveBeenCalled();
    })
  });

  describe("AuthProvider - Authorization Code Exchange", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should not call exchangeCodeWithTokens if no code is present in URL", () => {
      // GIVEN no code is present in the URL
      const givenCode = "";
      jest.spyOn(getCodeQueryParam, "getCodeQueryParam").mockReturnValue(givenCode);

      // WHEN the AuthProvider is rendered
      renderAuthContext();

      // THEN exchangeCodeWithTokens should not be called
      expect(exchangeCodeWithTokens).not.toHaveBeenCalled();
    });

    it("should call exchangeCodeWithTokens with code and updates tokens on success", async () => {
      jest.spyOn(window.history, "replaceState");

      // GIVEN: a code is present in the URL
      const mockCode = "test-code";
      jest.spyOn(getCodeQueryParam, "getCodeQueryParam").mockReturnValue(mockCode);

      // AND exchangeCodeWithTokens resolves with mock token data
      const mockTokenData = {
        access_token: "access-token",
        id_token: "id-token",
        refresh_token: "refresh-token",
        expires_in: 3600,
      };

      exchangeCodeWithTokens.mockResolvedValue(mockTokenData);

      // WHEN: the AuthProvider is rendered
      renderAuthContext();

      await Promise.resolve(); // Wait for all promises to resolve

      // THEN exchangeCodeWithTokens should be called with the code
      expect(exchangeCodeWithTokens).toHaveBeenCalledWith(mockCode);

      // AND the URL should be reset
      expect(window.history.replaceState).toHaveBeenCalledWith({}, document.title, "/");
    });

    it("logs an error when exchangeCodeWithTokens fails", async () => {
      console.error = jest.fn(); // Mock console.error

      // GIVEN: a code is present in the URL
      const mockCode = "test-code";
      jest.spyOn(getCodeQueryParam, "getCodeQueryParam").mockReturnValue(mockCode);

      // WHEN exchangeCodeWithTokens rejects with an error
      const error = new Error("Token exchange failed");
      exchangeCodeWithTokens.mockRejectedValue(error);

      // AND: the AuthProvider is rendered
      renderAuthContext();

      // THEN: the error should be logged
      await waitFor(() => {
        // AND a notification should be shown
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith("Failed to exchange provided code with tokens", {
          variant: "error",
        });
      });
    });

    it("should call initiate refresh token when the code was valid and a refresh token was retured", async () => {
      // GIVEN: a code is present in the URL
      const mockCode = "test-code";
      jest.spyOn(getCodeQueryParam, "getCodeQueryParam").mockReturnValue(mockCode);

      // AND exchangeCodeWithTokens resolves with mock token data
      const mockTokenData = {
        access_token: "access-token",
        id_token: "id-token",
        refresh_token: "refresh-token",
        expires_in: 3600,
      };

      exchangeCodeWithTokens.mockResolvedValue(mockTokenData);

      // WHEN: the AuthProvider is rendered
      renderAuthContext();

      // THEN: initiateRefreshTokens should be called with the refresh token
      await waitFor(() => {
        expect(initiateRefreshTokens).toHaveBeenCalledWith(
          mockTokenData.refresh_token,
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    it("should clear the timer when the component unmounts and a valid refresh token was retured", async () => {
      const clearSpy = jest.spyOn(global, "clearInterval");
      // GIVEN: a code is present in the URL
      const mockCode = "given-foo-code";
      jest.spyOn(getCodeQueryParam, "getCodeQueryParam").mockReturnValue(mockCode);

      // AND a timer will be returned.
      const timer = 1 as unknown as NodeJS.Timeout;
      initiateRefreshTokens.mockResolvedValue(timer);

      // AND exchangeCodeWithTokens resolves with mock token data
      const mockTokenData = {
        access_token: "access-token",
        id_token: "id-token",
        refresh_token: "refresh-token",
        expires_in: 3600,
      };

      exchangeCodeWithTokens.mockResolvedValue(mockTokenData);

      // WHEN: the AuthProvider is rendered
      const { unmount } = renderAuthContext();

      await Promise.resolve();

      // AND: initiateRefreshTokens has been called with the refresh token
      await waitFor(() => {
        expect(initiateRefreshTokens).toHaveBeenCalledWith(
          mockTokenData.refresh_token,
          expect.any(Function),
          expect.any(Function)
        );
      });

      // AND the AuthProvider is unmounted
      unmount();

      // THEN the timer should be cleared
      await waitFor(() => {
        expect(clearSpy).toHaveBeenCalledWith(timer);
      });
    });

    it("should not clear the timer when the component unmounts and no timer was returned", async () => {
      const clearSpy = jest.spyOn(global, "clearInterval");
      // GIVEN: a code is present in the URL
      const mockCode = "given-foo-code";
      jest.spyOn(getCodeQueryParam, "getCodeQueryParam").mockReturnValue(mockCode);

      // AND a timer will be returned.
      const timer = null as unknown as NodeJS.Timeout;
      initiateRefreshTokens.mockResolvedValue(timer);

      // AND exchangeCodeWithTokens resolves with mock token data
      const mockTokenData = {
        access_token: "access-token",
        id_token: "id-token",
        refresh_token: "refresh-token",
        expires_in: 3600,
      };

      exchangeCodeWithTokens.mockResolvedValue(mockTokenData);

      // WHEN: the AuthProvider is rendered
      const { unmount } = renderAuthContext();

      await Promise.resolve();

      // AND: initiateRefreshTokens has been called with the refresh token
      await waitFor(() => {
        expect(initiateRefreshTokens).toHaveBeenCalledWith(
          mockTokenData.refresh_token,
          expect.any(Function),
          expect.any(Function)
        );
      });

      // AND the AuthProvider is unmounted
      unmount();

      // THEN the timer should be cleared
      expect(clearSpy).not.toHaveBeenCalledWith(timer);
    });
  });

  describe("authContextDefaultValue", () => {
    test("should return the default values", () => {
      // GIVEN: Default values for the AuthContext
      const givenAuthContextDefaultValue = authContextDefaultValue;

      // THEN: The default values should be as expected
      expect(givenAuthContextDefaultValue.hasRole).toBeDefined();

      // AND the default values should not have any roles
      expect(givenAuthContextDefaultValue.hasRole(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)).toBeFalse();
    });
  });
});
