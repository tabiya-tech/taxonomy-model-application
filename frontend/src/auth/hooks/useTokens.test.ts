import { useTokens } from "src/auth/hooks/useTokens"
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthPersistentStorage } from "src/auth/services/AuthPersistentStorage";
import { AuthService } from "src/auth/services/AuthService";

const TOKEN_VALUE = "foo"
const EXPIRES_IN = 3600;

const clearInterval = jest.spyOn(global, 'clearInterval');

const updateUserByAccessToken = jest.fn();
const params = { updateUserByAccessToken }

describe("use Tokens hook tests", () => {
  describe('refreshToken', () => {
    test("it should return null when not set", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens(params));

      // WHEN no token is set

      // THEN the refresh token should be null
      expect(result.current.refreshToken).toBe("");
    })

    test("it should return the refresh token when set", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens(params));

      // WHEN refresh token is set
      act(() => { result.current.setRefreshToken(TOKEN_VALUE) });

      // THEN the refresh token should be set
      expect(result.current.refreshToken).toBe(TOKEN_VALUE);
    })

    test("when the refresh token is updated", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens(params));

      // WHEN refresh token is set
      act(() => { result.current.setRefreshToken(TOKEN_VALUE) });

      // THEN the refresh should be set
      expect(result.current.refreshToken).toBe(TOKEN_VALUE);

      // WHEN the refresh token is updated
      act(() => { result.current.setRefreshToken("bar") });

      // THEN the refresh token should be updated
      expect(result.current.refreshToken).toBe("bar");
      expect(result.current.refreshToken).not.toBe(TOKEN_VALUE);
    })

    test("on set refresh token, it should set the refresh token in the storage", () => {
      const storageSetRefreshTokenFn = jest.spyOn(AuthPersistentStorage, 'setRefreshToken');

      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens(params));

      // WHEN refresh token is set
      act(() => { result.current.setRefreshToken(TOKEN_VALUE) });

      // THEN the refresh token should be set
      expect(result.current.refreshToken).toBe(TOKEN_VALUE);
      expect(storageSetRefreshTokenFn).toHaveBeenCalledWith(TOKEN_VALUE);
    })
  });


  describe("Clear all Tokens", () => {
    test("It should call the AuthPersistentStorage.clear", () => {
      const storageClearFn = jest.spyOn(AuthPersistentStorage, 'clear');

      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens(params));

      // WHEN clear all tokens is called
      act(() => { result.current.clearTokens() });

      // THEN the storage should be cleared
      expect(storageClearFn).toHaveBeenCalled();
    })

    test("it should call the setRefreshToken with empty string", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens(params));
      // AND the refresh token is set
      act(() => { result.current.setRefreshToken(TOKEN_VALUE) });

      // WHEN clear all tokens is called
      act(() => { result.current.clearTokens() });

      // THEN the refresh token should be set to empty string
      expect(result.current.refreshToken).toBe("");
    })
  })


  describe('Refreshing of tokens', () => {
    beforeEach(() => {
      AuthPersistentStorage.clear();
      jest.clearAllMocks();
    })

    afterAll(() => {
      AuthPersistentStorage.clear();
    })

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("It should call the endpoint with the refresh token", async() => {
      let initiateRefreshTokens = jest.spyOn(AuthService.prototype, 'initiateRefreshTokens')

      // GIVEN we have a refresh token in the storage.
      AuthPersistentStorage.setRefreshToken(TOKEN_VALUE);

      // AND the hook is used in a component
      const { result } = renderHook(() => useTokens(params));

      // WHEN the tokens refreshing process starts
      await waitFor(() => expect(result.current.isAuthenticating).toBe(true))


      // THEN the endpoint should be called with the refresh token
      expect(initiateRefreshTokens).toHaveBeenCalledWith(TOKEN_VALUE, expect.any(Function), expect.any(Function));

      // AND WHEN the callback is called
      const callback = initiateRefreshTokens.mock.calls[0][1];
      act(() => {
        callback({ access_token: TOKEN_VALUE, id_token: TOKEN_VALUE, expires_in: EXPIRES_IN });
      })

      // THE updated user by access token should be called
      expect(updateUserByAccessToken).toHaveBeenCalledWith(TOKEN_VALUE);

      // AND the refreshing should stop
      expect(result.current.isAuthenticating).toBe(false);
    })
  });

  test("when no token is set, it should not call the endpoint", async() => {
    let initiateRefreshTokens = jest.spyOn(AuthService.prototype, 'initiateRefreshTokens')

    // GIVEN the hook is used in a component
    const { result } = renderHook(() => useTokens(params));

    // WHEN the tokens refreshing process starts
    await waitFor(() => expect(result.current.isAuthenticating).toBe(false))

    // THEN the endpoint should not be called
    expect(initiateRefreshTokens).not.toHaveBeenCalled();
  })

  test("should clear timer upon unmounted", async() => {
    let initiateRefreshTokens = jest.spyOn(AuthService.prototype, 'initiateRefreshTokens')

    // GIVEN we have a refresh token in the storage.
    AuthPersistentStorage.setRefreshToken(TOKEN_VALUE);

    // AND the hook is used in a component
    const { result, unmount } = renderHook(() => useTokens(params));

    // WHEN the tokens refreshing process starts
    await waitFor(() => expect(result.current.isAuthenticating).toBe(true))

    // THEN the endpoint should be called with the refresh token
    expect(initiateRefreshTokens).toHaveBeenCalledWith(TOKEN_VALUE, expect.any(Function), expect.any(Function));

    // WHEN the component is unmounted
    unmount();

    expect(clearInterval).toHaveBeenCalled()
  })

  test("should clear the correct timer timer upon unmounted", async() => {
    const givenTimerNumber = 11;
    jest.spyOn(AuthService.prototype, 'initiateRefreshTokens').mockResolvedValue(givenTimerNumber as unknown as NodeJS.Timer)

    // GIVEN we have a refresh token in the storage.
    AuthPersistentStorage.setRefreshToken(TOKEN_VALUE);

    // AND the hook is used in a component
    const { result, unmount } = renderHook(() => useTokens(params));

    // WHEN the tokens refreshing process starts
    await waitFor(() => expect(result.current.isAuthenticating).toBe(true))

    await Promise.resolve()

    // WHEN the component is unmounted
    unmount();

    expect(clearInterval).toHaveBeenCalled()
  })

  test("on success, it should set the auth token in the storage", async() => {
    let initiateRefreshTokens = jest.spyOn(AuthService.prototype, 'initiateRefreshTokens')

    // GIVEN we have a refresh token in the storage.
    AuthPersistentStorage.setRefreshToken(TOKEN_VALUE);
    const givenAccessToken = TOKEN_VALUE+"-access";

    // AND the hook is used in a component
    const { result } = renderHook(() => useTokens(params));

    // WHEN the tokens refreshing process starts
    await waitFor(() => expect(result.current.isAuthenticating).toBe(true))


    // WHEN the callback is called
    const callback = initiateRefreshTokens.mock.calls[0][1];
    act(() => {
      callback({ access_token: givenAccessToken, id_token: TOKEN_VALUE, expires_in: EXPIRES_IN });
    })

    // THEN the auth token should be set
    expect(AuthPersistentStorage.getAuthToken()).toBe(givenAccessToken);
  })

  test("on unauthorized, it should clear the storage", async() => {
    let initiateRefreshTokens = jest.spyOn(AuthService.prototype, 'initiateRefreshTokens')

    // GIVEN we have a refresh token in the storage.
    AuthPersistentStorage.setRefreshToken(TOKEN_VALUE);

    // AND the hook is used in a component
    const { result } = renderHook(() => useTokens(params));

    // WHEN the tokens refreshing process starts
    await waitFor(() => expect(result.current.isAuthenticating).toBe(true))


    // WHEN the anauthorized callback is called
    const callback = initiateRefreshTokens.mock.calls[0][2];
    act(() => {
      callback();
    })

    // THEN the auth token should be set
    expect(AuthPersistentStorage.getRefreshToken()).toBe(null);
  })
})
