import { useTokens } from "./useTokens"
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthPersistentStorage } from "../services/AuthPersistentStorage";
import { AuthService } from "../services/AuthService";

const TOKEN_VALUE = "foo"

const clearInterval = jest.spyOn(global, 'clearInterval');

describe("use Tokens hook tests", () => {
  describe('identityToken', () => {
    test("it should return null when not set", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens());

      // WHEN no token is set

      // THEN the identityToken should be null
      expect(result.current.identityToken).toBe("");
    })

    test("it should return the identity token when set", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens());

      // WHEN an identity token is set
      act(() => { result.current.setIdentityToken(TOKEN_VALUE) });

      // THEN the identityToken should be set
      expect(result.current.identityToken).toBe(TOKEN_VALUE);
    })

    test("when the identity token is updated", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens());

      // WHEN an identity token is set
      act(() => { result.current.setIdentityToken(TOKEN_VALUE) });

      // THEN the identityToken should be set
      expect(result.current.identityToken).toBe(TOKEN_VALUE);

      // WHEN the identity token is updated
      act(() => { result.current.setIdentityToken("bar") });

      // THEN the identityToken should be updated
      expect(result.current.identityToken).toBe("bar");
      expect(result.current.identityToken).not.toBe(TOKEN_VALUE);
    })
  });

  describe('accessToken', () => {
    test("it should return null when not set", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens());

      // WHEN no token is set

      // THEN the access token should be null
      expect(result.current.accessToken).toBe("");
    })

    test("it should return the access token when set", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens());

      // WHEN an access token is set
      act(() => { result.current.setAccessToken(TOKEN_VALUE) });

      // THEN the access token should be set
      expect(result.current.accessToken).toBe(TOKEN_VALUE);
    })

    test("when the access token is updated", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens());

      // WHEN an access token is set
      act(() => { result.current.setAccessToken(TOKEN_VALUE) });

      // THEN the access should be set
      expect(result.current.accessToken).toBe(TOKEN_VALUE);

      // WHEN the access token is updated
      act(() => { result.current.setAccessToken("bar") });

      // THEN the access token should be updated
      expect(result.current.accessToken).toBe("bar");
      expect(result.current.accessToken).not.toBe(TOKEN_VALUE);
    })
  });

  describe('refreshToken', () => {
    test("it should return null when not set", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens());

      // WHEN no token is set

      // THEN the refresh token should be null
      expect(result.current.refreshToken).toBe("");
    })

    test("it should return the refresh token when set", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens());

      // WHEN refresh token is set
      act(() => { result.current.setRefreshToken(TOKEN_VALUE) });

      // THEN the refresh token should be set
      expect(result.current.refreshToken).toBe(TOKEN_VALUE);
    })

    test("when the refresh token is updated", () => {
      // GIVEN: The hook is used in a component
      const { result } = renderHook(() => useTokens());

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
      const { result } = renderHook(() => useTokens());

      // WHEN refresh token is set
      act(() => { result.current.setRefreshToken(TOKEN_VALUE) });

      // THEN the refresh token should be set
      expect(result.current.refreshToken).toBe(TOKEN_VALUE);
      expect(storageSetRefreshTokenFn).toHaveBeenCalledWith(TOKEN_VALUE);
    })
  });

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
      const { result } = renderHook(() => useTokens());

      // WHEN the tokens refreshing process starts
      await waitFor(() => expect(result.current.isAuthenticating).toBe(true))


      // THEN the endpoint should be called with the refresh token
      expect(initiateRefreshTokens).toHaveBeenCalledWith(TOKEN_VALUE, expect.any(Function));

      // AND WHEN the callback is called
      const callback = initiateRefreshTokens.mock.calls[0][1];
      act(() => {
        callback({ access_token: TOKEN_VALUE, id_token: TOKEN_VALUE, refresh_token: TOKEN_VALUE });
      })

      // THEN the tokens should be updated
      expect(result.current.accessToken).toBe(TOKEN_VALUE);
      expect(result.current.identityToken).toBe(TOKEN_VALUE);

      // AND the refreshing should stop
      expect(result.current.isAuthenticating).toBe(false);
    })
  });

  test("when no token is set, it should not call the endpoint", async() => {
    let initiateRefreshTokens = jest.spyOn(AuthService.prototype, 'initiateRefreshTokens')

    // GIVEN the hook is used in a component
    const { result } = renderHook(() => useTokens());

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
    const { result, unmount } = renderHook(() => useTokens());

    // WHEN the tokens refreshing process starts
    await waitFor(() => expect(result.current.isAuthenticating).toBe(true))

    // THEN the endpoint should be called with the refresh token
    expect(initiateRefreshTokens).toHaveBeenCalledWith(TOKEN_VALUE, expect.any(Function));

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
    const { result, unmount } = renderHook(() => useTokens());

    // WHEN the tokens refreshing process starts
    await waitFor(() => expect(result.current.isAuthenticating).toBe(true))

    await Promise.resolve()

    // WHEN the component is unmounted
    unmount();

    expect(clearInterval).toHaveBeenCalled()
  })
})
