import { useContext } from "react";
import { AuthContext, authContextDefaultValue } from "src/auth/AuthProvider";
import { AUTH_URL, COGNITO_CLIENT_ID } from "src/auth/constants";
import { renderHook } from "src/_test_utilities/test-utils";
import { AuthPersistentStorage } from "src/auth/services/AuthPersistentStorage";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";

import * as useAuthUserHook from "src/auth/hooks/useAuthUser";
import * as useTokensHook from "src/auth/hooks/useTokens";
import * as getCodeQueryParam from "src/auth/utils/getCodeQueryParam";
import { AuthService } from "src/auth/services/AuthService";
import { act, waitFor } from "@testing-library/react";
import { mockLoggedInUser } from "src/_test_utilities/mockLoggedInUser";
import { defaultUseTokensResponse } from "src/auth/hooks/useTokens";

import AuthAPISpecs from "api-specifications/auth";

jest.mock("src/auth/hooks/useAuthUser");
jest.mock("src/auth/hooks/useTokens");

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

const open = jest.spyOn(window, "open").mockReturnValue(null);
const clear = jest.spyOn(AuthPersistentStorage, "clear");
const exchangeCodeWithTokens = jest.spyOn(AuthService.prototype, "exchangeCodeWithTokens");

function defaultSetup() {
  mockLoggedInUser({});

  // @ts-ignore
  useTokensHook.useTokens.mockReturnValue(defaultUseTokensResponse);
}

const renderAuthContext = () => renderHook(() => useContext(AuthContext));

describe("AuthProvider module", () => {
  beforeEach(() => {
    jest.useFakeTimers(); // Use Jest's fake timers
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test
    jest.useRealTimers(); // Switch back to real timers after each test
  });

  beforeAll(defaultSetup);

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
      const clearTokens = jest.fn();

      // @ts-ignore
      useTokensHook.useTokens.mockReturnValue({ clearTokens });

      // GIVEN the Auth Provider is rendered and auth context is accessed
      const { result } = renderAuthContext();

      // AND the refresh token is set
      AuthPersistentStorage.setRefreshToken("foo");

      // WHEN the logout function is called
      act(() => result.current?.logout());

      // THEN the refresh token should be cleared
      expect(AuthPersistentStorage.getRefreshToken()).toBeNull();

      // AND the clear function should be called
      expect(clear).toHaveBeenCalled();

      // AND clear tokens should be called
      expect(clearTokens).toHaveBeenCalled();
    });
  });

  describe("AuthProvider - Authorization Code Exchange", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("does not call exchangeCodeWithTokens if no code is present in URL", () => {
      // GIVEN no code is present in the URL
      const givenCode = "";
      jest.spyOn(getCodeQueryParam, "getCodeQueryParam").mockReturnValue(givenCode);

      // WHEN the AuthProvider is rendered
      renderAuthContext();

      // THEN exchangeCodeWithTokens should not be called
      expect(exchangeCodeWithTokens).not.toHaveBeenCalled();
    });

    it("calls exchangeCodeWithTokens with code and updates tokens on success", async () => {
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

      const mockSetAccessToken = jest.fn();
      const mockSetIdentityToken = jest.fn();
      const mockSetRefreshToken = jest.fn();
      const mockSetIsAuthenticated = jest.fn();

      // @ts-ignore
      useTokensHook.useTokens.mockReturnValue({
        setAccessToken: mockSetAccessToken,
        setIdentityToken: mockSetIdentityToken,
        setRefreshToken: mockSetRefreshToken,
        setIsAuthenticated: mockSetIsAuthenticated,
      });

      const mockUpdateUserByAccessToken = jest.fn();

      // @ts-ignore
      useAuthUserHook.useAuthUser.mockReturnValue({
        updateUserByAccessToken: mockUpdateUserByAccessToken,
      });

      // WHEN: the AuthProvider is rendered
      renderAuthContext();

      await Promise.resolve(); // Wait for all promises to resolve

      // THEN exchangeCodeWithTokens should be called with the code
      expect(exchangeCodeWithTokens).toHaveBeenCalledWith(mockCode);

      // AND the tokens should be updated
      await waitFor(() => expect(mockSetAccessToken).toHaveBeenCalledWith(mockTokenData.access_token));

      // AND the refresh token should be updated
      expect(mockSetRefreshToken).toHaveBeenCalledWith(mockTokenData.refresh_token);

      // AND updateUserByAccessToken should be called
      expect(mockUpdateUserByAccessToken).toHaveBeenCalledWith(mockTokenData.access_token);

      // AND setIsAuthenticated should be called with true
      expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true);

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
