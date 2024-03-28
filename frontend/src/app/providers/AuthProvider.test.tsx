import {
  getCodeQueryParam,
  userHasRoles,
  TabiyaUserRole,
  AuthContext,
  AUTH_URL,
  COGNITO_CLIENT_ID, REDIRECT_URL, REFRESH_TOKEN_TIMEFRAME
} from "./AuthProvider";

import { render, screen, renderHook, waitFor , act } from "src/_test_utilities/test-utils";
import { useContext } from "react";
import { useCookies } from "react-cookie"

const TEST_IDS = {
  IS_LOGGED_IN: "auth-provider-is-logged-in",
}

const mockRemoveCookie = jest.fn();

jest.mock('react-cookie', () => ({
  useCookies: jest.fn().mockReturnValue([
    {
      identityToken: "token",
      accessToken: "token",
    }, // Mock cookies
    jest.fn(), // Mock setCookie
    (params: string) => mockRemoveCookie(params)
  ]),
}));

jest.mock('react-cookie', () => ({
  useCookies: jest.fn().mockReturnValue([
    {
      identityToken: "token",
      accessToken: "token"
    }, // Mock cookies
    jest.fn(), // Mock setCookie
    (params: string) => mockRemoveCookie(params)
  ]),
}));

jest.mock("jwt-decode", () => {
  return {
    jwtDecode: (token: string) => ({
      "cognito:username": "test-user",
      "cognito:groups": ["model-managers"]
    })
  }
})

jest.mock("react-router-dom", () => ({
  useLocation: jest.fn().mockReturnValue({
    search: "?code=12345"
  })
}))

// Mock window.location and window.open
const originalLocation = window.location;
window.location = { ...originalLocation, origin: 'http://localhost', search: '' };
window.open = jest.fn();

// @ts-ignore
window.setInterval = jest.fn();

// Mock fetch for API calls
// @ts-ignore
window.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ access_token: 'token', refresh_token: 'refresh', id_token: 'idToken', expires_in: 36000 }),
  })
);

describe("AuthProvider", () => {
  afterAll(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.resetAllMocks();
  })

  describe('AuthProvider/getCodeQueryParam', () => {
    it('returns the value of the "code" parameter when it is present', () => {
      const location = {
        search: '?code=12345'
      };
      const result = getCodeQueryParam(location);
      expect(result).toBe('12345');
    });

    it('returns an empty string when the "code" parameter is present but has no value', () => {
      const location = {
        search: '?code='
      };
      const result = getCodeQueryParam(location);
      expect(result).toBe('');
    });

    it('returns an empty string when the "code" parameter is not present', () => {
      const location = {
        search: '?param=other'
      };
      const result = getCodeQueryParam(location);
      expect(result).toBe('');
    });

    it('returns an empty string when the URL search part is empty', () => {
      const location = {
        search: ''
      };
      const result = getCodeQueryParam(location);
      expect(result).toBe('');
    });

    it('returns the correct "code" value when there are multiple query parameters', () => {
      const location = {
        search: '?param=other&code=abc123&anotherParam=something'
      };
      const result = getCodeQueryParam(location);
      expect(result).toBe('abc123');
    });
  });

  describe('AuthProvider/userHasRoles', () => {
    test('returns true for null user and AnonymousUser role', () => {
      expect(userHasRoles(TabiyaUserRole.AnonymousUser, null)).toBe(true);
    });

    test('returns false for null user and RegisteredUser role', () => {
      expect(userHasRoles(TabiyaUserRole.RegisteredUser, null)).toBe(false);
    });

    test('returns true for defined user without roles and RegisteredUser role', () => {
      const user = { username: "test", roles: [] }; // Assuming a simple structure for testing
      expect(userHasRoles(TabiyaUserRole.RegisteredUser, user)).toBe(true);
    });

    test('returns true for user with matching role', () => {
      const user = { username: "test", roles: [TabiyaUserRole.ModelManager] };
      expect(userHasRoles(TabiyaUserRole.ModelManager, user)).toBe(true);
    });

    test('returns false for user without matching role', () => {
      const user = { username: "test", roles: [] }; // Assuming 'User' is a valid role but not the one we're checking
      expect(userHasRoles(TabiyaUserRole.ModelManager, user)).toBe(false);
    });
  });
  describe("Provider", () => {
    test("return logged in false by default", () => {
      render(<ChildComponent />, { useAuthProvider: true })
      expect(screen.getByTestId(TEST_IDS.IS_LOGGED_IN).textContent).toBe("true")
    })

    test("Should return correct properties in the context", () => {
      const { result } = renderHook(() => useContext(AuthContext), { useAuthProvider: true })
      expect(result.current.user).toStrictEqual({ username: "test-user", roles: ["model-managers"] })
    })

    test("Logout functionality", () => {
      // GIVEN that the user is logged in
      const { result } = renderHook(() => useContext(AuthContext), { useAuthProvider: true })

      // WHEN the user logs out
      result.current?.logout()

      // THEN expect the user to be logged out
      expect(mockRemoveCookie).toHaveBeenCalledTimes(4)

      expect(mockRemoveCookie).toHaveBeenNthCalledWith(1,"accessToken")
      expect(mockRemoveCookie).toHaveBeenNthCalledWith(2,"refreshToken")
      expect(mockRemoveCookie).toHaveBeenNthCalledWith(3,"identityToken")
      expect(mockRemoveCookie).toHaveBeenNthCalledWith(4,"authCookie")

      expect(window.open)
        .toHaveBeenCalledWith(
          `${AUTH_URL}/logout?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=model-api%2Fmodel-api+openid&redirect_uri=${encodeURIComponent(REDIRECT_URL)}/`, "_self")
    })

    test("Login functionality", () => {
      // GIVEN that the user is not logged in
      const { result } = renderHook(() => useContext(AuthContext), { useAuthProvider: true })

      // WHEN the user logs in
      result.current?.login()

      // THEN expect the login endpoint to be called
      expect(window.open)
        .toHaveBeenCalledWith(
          `${AUTH_URL}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=model-api%2Fmodel-api+openid&redirect_uri=${encodeURIComponent(REDIRECT_URL)}/`, "_self")
    })

    test("Has Role function", async () => {
      const { result } = renderHook(() => useContext(AuthContext), { useAuthProvider: true })

      // GIVEN that the user is not logged in
      await waitFor(() => {
        expect(result?.current?.user?.username).toBe("test-user")
      })

      // THEN expect the user to have the role
      expect(result.current?.hasRole(TabiyaUserRole.ModelManager)).toBe(true)
    })
  })

  describe("Provider/ExchangeCodeWithTokens", () => {
    // mock the window.location.search

    beforeAll(() => {

      // @ts-ignore
      useCookies.mockReturnValue([
        {
          identityToken: "",
          accessToken: ""
        }, // Mock cookies
        jest.fn(), // Mock setCookie
        (params: string) => mockRemoveCookie(params)
      ]);

      Object.defineProperty(window, 'location', {
        value: {
          search: "?code=3232323232"
        },
        writable: true // possibility to override
      });

    })

    test("It should return the user details after cognito redirection", async  () => {
      // GIVEN that the user is not logged in
      const { result } = renderHook(() => useContext(AuthContext), { useAuthProvider: true })

      // GIVEN that the user is  logged in
      await waitFor(() => {
        expect(result?.current?.user?.username).toBe("test-user")
      })

      // THEN expect the user to be logged in
      act(() => {
        expect(result.current?.user).toStrictEqual({ username: "test-user", roles: ["model-managers"] })
      })
    })
  })

  describe("Provider/RefreshingTokens/Time-Elapsed", () => {
    beforeAll(() => {
      Object.defineProperty(window, 'location', {
        value: {
          search: "?code=3232323232"
        },
        writable: true // possibility to override
      });

      //@ts-ignore
      useCookies.mockReturnValueOnce([
        {
          identityToken: "token",
          accessToken: "token",
          refreshToken: "token",
          nextRefreshTime: Date.now() - 1000
        }, // Mock cookies
        jest.fn(), // Mock setCookie
        (params: string) => mockRemoveCookie(params)
      ]);
    })

    test("Should call refresh token endpoint if time has already elapsed", async () => {
      // GIVEN that the user is already logged in
      const { result } = renderHook(() => useContext(AuthContext), { useAuthProvider: true })

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {

        await waitFor(() => {
          expect(result?.current?.user?.username).toBe("test-user")
        })

        // THEN expect the refresh token endpoint to be called
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalled();
        })
      })
    })
  })

  describe("Provider/RefreshingTokens/timeinterval", () => {
    beforeAll(() => {
      Object.defineProperty(window, 'location', {
        value: {
          search: "?code=3232323232"
        },
        writable: true // possibility to override
      });

      //@ts-ignore
      useCookies.mockReturnValue([
        {
          identityToken: "token",
          accessToken: "token",
          refreshToken: "token",
          nextRefreshTime: Date.now() + 1000
        }, // Mock cookies
        jest.fn(), // Mock setCookie
        (params: string) => mockRemoveCookie(params)
      ]);
    })

    test(`Should call refresh token endpoint if every after ${REFRESH_TOKEN_TIMEFRAME} millseconds`, async () => {
      // GIVEN that the user is already logged in
      renderHook(() => useContext(AuthContext), { useAuthProvider: true })

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        // WHEN the next time reflesh has elapsed.

        await waitFor(() => {
          expect(setInterval).toHaveBeenCalled();
        })
      })
    })
  })
})

const ChildComponent = () => {
  const context = useContext(AuthContext)
  return (
      <div>
        <div>is logged in <span data-testid={TEST_IDS.IS_LOGGED_IN}>{JSON.stringify(!!context?.user)}</span></div>
      </div>
  )
}
