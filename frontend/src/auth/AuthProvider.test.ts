import { useContext } from "react";
import { AuthContext } from "./AuthProvider";
import { AUTH_URL, COGNITO_CLIENT_ID } from "./constants";
import { renderHook, act } from "src/_test_utilities/test-utils";
import { AuthPersistentStorage } from "./services/AuthPersistentStorage";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";

import * as useAuthUserHook from './hooks/useAuthUser';
import * as useTokensHook from './hooks/useTokens';
import * as getCodeQueryParam from "./utils/getCodeQueryParam";
import { AuthService } from "./services/AuthService";
import {waitFor} from "@testing-library/react";


jest.mock('./hooks/useAuthUser');
jest.mock('./hooks/useTokens');

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

const open = jest.spyOn(window, "open").mockReturnValue(null)
const clearRefreshToken = jest.spyOn(AuthPersistentStorage, "clearRefreshToken")
const exchangeCodeWithTokens = jest.spyOn(AuthService.prototype, "exchangeCodeWithTokens")

function defaultSetup(){
  // @ts-ignore
  useAuthUserHook.useAuthUser.mockReturnValue({
    user: null,
    hasRole: jest.fn(),
    updateUserByAccessToken: jest.fn(),
  });

  // @ts-ignore
  useTokensHook.useTokens.mockReturnValue({
    accessToken: "foo",
    identityToken: "foo",
    refreshToken: "foo"
  });
}

const renderAuthContext = () =>  renderHook(() => useContext(AuthContext))


describe("AuthProvider module", () => {
  beforeEach(() => {
    jest.useFakeTimers(); // Use Jest's fake timers
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test
    jest.useRealTimers(); // Switch back to real timers after each test
  });

  describe('AuthProvider Component tests', () => {
    beforeAll(defaultSetup)

    describe("Login functionality", () => {
      test("should call the login url with the correct parameters", () => {
        // GIVEN: The Auth Provider is rendered and auth context is accessed
        const { result } = renderAuthContext()

        // WHEN the login function is called
        result.current?.login()

        // THEN: The window should be redirected to the login url
        // AND the url should contain the correct parameters
        expect(open)
          .toHaveBeenCalledWith(`${AUTH_URL}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=model-api%2Fmodel-api+openid&redirect_uri=${encodeURIComponent(window.location.origin)}/`, `_self`)
      })
    })

    describe("Logout functionality", () => {
      test("should call the login url with the correct parameters", () => {
        // GIVEN: The Auth Provider is rendered and auth context is accessed
        const { result } = renderAuthContext()

        // WHEN the login function is called
        result.current?.logout()

        // THEN: The window should be redirected to the login url
        expect(open).toHaveBeenCalled()
        // AND the url should contain the correct parameters
        expect(open)
          .toHaveBeenCalledWith(`${AUTH_URL}/logout?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=model-api%2Fmodel-api+openid&redirect_uri=${encodeURIComponent(window.location.origin)}/`, `_self`)
      })

      test("it should clear the refresh token when the logout function is called", () => {
        // GIVEN the Auth Provider is rendered and auth context is accessed
        const { result } = renderAuthContext()

        // AND the refresh token is set
        AuthPersistentStorage.setRefreshToken("foo")

        // WHEN the logout function is called
        result.current?.logout()

        // THEN the refresh token should be cleared
        expect(AuthPersistentStorage.getRefreshToken()).toBeNull()

        // AND the clearRefreshToken function should be called
        expect(clearRefreshToken).toHaveBeenCalled()
      })
    })

    describe('AuthProvider - update user by access token', () => {
      it('calls updateUserByAccessToken if accessToken exists and user is null', () => {
        const mockUpdateUserByAccessToken = jest.fn();

        // @ts-ignore
        useAuthUserHook.useAuthUser.mockReturnValue({
          user: null,
          updateUserByAccessToken: mockUpdateUserByAccessToken,
        });

        // GIVEN: the access token exists and the user is null
        // Mock the useTokens hook
        const mockAccessToken = 'test-access-token';

        // @ts-ignore
        useTokensHook.useTokens.mockReturnValue({
          accessToken: mockAccessToken,
        });

        // WHEN: the AuthProvider is rendered and the AuthContext is accessed
        renderAuthContext()

        // THEN updateUserByAccessToken should be called
        expect(mockUpdateUserByAccessToken).toHaveBeenCalledWith(mockAccessToken);
      });

      it("should call the mockUpdateUserByAccessToken function when the access token changes again", () => {
        const mockUpdateUserByAccessToken = jest.fn();

        // @ts-ignore
        useAuthUserHook.useAuthUser.mockReturnValue({
          user: null,
          updateUserByAccessToken: mockUpdateUserByAccessToken,
        });

        // GIVEN: the access token exists and the user is null
        // Mock the useTokens hook
        const mockAccessToken = 'test-access-token';

        // @ts-ignore
        useTokensHook.useTokens.mockReturnValue({
          accessToken: mockAccessToken,
        });

        // WHEN: the AuthProvider is rendered and the AuthContext is accessed
        const { rerender } = renderAuthContext()

        // THEN updateUserByAccessToken should be called
        expect(mockUpdateUserByAccessToken).toHaveBeenCalledWith(mockAccessToken);

        // WHEN: the access token changes
        const newMockAccessToken = 'new-test-access-token';

        // @ts-ignore
        useTokensHook.useTokens.mockReturnValue({
          accessToken: newMockAccessToken,
        });

        rerender();

        // THEN updateUserByAccessToken should be called with the new access token
        expect(mockUpdateUserByAccessToken).toHaveBeenCalledWith(newMockAccessToken);
      })
    });

    describe('AuthProvider - Authorization Code Exchange', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('does not call exchangeCodeWithTokens if no code is present in URL', () => {
        // GIVEN no code is present in the URL
        const givenCode = "";
        jest.spyOn(getCodeQueryParam, "getCodeQueryParam").mockReturnValue(givenCode);

        // WHEN the AuthProvider is rendered
        renderAuthContext()

        // THEN exchangeCodeWithTokens should not be called
        expect(exchangeCodeWithTokens).not.toHaveBeenCalled();
      });

      it('calls exchangeCodeWithTokens with code and updates tokens on success', async () => {
        jest.spyOn(window.history, 'replaceState');


        // GIVEN: a code is present in the URL
        const mockCode = 'test-code';
        jest.spyOn(getCodeQueryParam, "getCodeQueryParam").mockReturnValue(mockCode);

        // AND exchangeCodeWithTokens resolves with mock token data
        const mockTokenData = {
          access_token: 'access-token',
          id_token: 'id-token',
          refresh_token: 'refresh-token',
          expires_in: 3600
        };

        exchangeCodeWithTokens.mockResolvedValue(mockTokenData);

        const mockSetAccessToken = jest.fn();
        const mockSetIdentityToken = jest.fn();
        const mockSetRefreshToken = jest.fn();

        // @ts-ignore
        useTokensHook.useTokens.mockReturnValue({
          setAccessToken: mockSetAccessToken,
          setIdentityToken: mockSetIdentityToken,
          setRefreshToken: mockSetRefreshToken,
        });

        const mockUpdateUserByAccessToken = jest.fn();

        // @ts-ignore
        useAuthUserHook.useAuthUser.mockReturnValue({
          updateUserByAccessToken: mockUpdateUserByAccessToken,
        });

        // WHEN: the AuthProvider is rendered
        renderAuthContext()

        await act(async () => {
          await Promise.resolve(); // Wait for all promises to resolve

          // THEN exchangeCodeWithTokens should be called with the code
          expect(exchangeCodeWithTokens).toHaveBeenCalledWith(mockCode);

          // AND the tokens should be updated
          expect(mockSetAccessToken).toHaveBeenCalledWith(mockTokenData.access_token);

          // AND the identity token should be updated
          expect(mockSetIdentityToken).toHaveBeenCalledWith(mockTokenData.id_token);

          // AND the refresh token should be updated
          expect(mockSetRefreshToken).toHaveBeenCalledWith(mockTokenData.refresh_token);

          // AND updateUserByAccessToken should be called
          expect(mockUpdateUserByAccessToken).toHaveBeenCalledWith(mockTokenData.access_token);

          // AND the URL should be reset
          expect(window.history.replaceState).toHaveBeenCalledWith({}, document.title, "/");
        })
      });

      it('logs an error when exchangeCodeWithTokens fails', async () => {
        console.error = jest.fn(); // Mock console.error

        // GIVEN: a code is present in the URL
        const mockCode = 'test-code';
        jest.spyOn(getCodeQueryParam, "getCodeQueryParam").mockReturnValue(mockCode);

        // WHEN exchangeCodeWithTokens rejects with an error
        const error = new Error('Token exchange failed');
        exchangeCodeWithTokens.mockRejectedValue(error);

        // AND: the AuthProvider is rendered
        renderAuthContext();

        // THEN: the error should be logged
        await waitFor(() => {
          // AND a notification should be shown
          expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith("Failed to exchange provided code with tokens", { variant: "error" })
        })
      });
    });
  });
});
