import { AuthService } from "src/auth/services/AuthService";
import { StatusCodes } from "http-status-codes";
import { setupFetchSpy } from "src/_test_utilities/fetchSpy";
import { AUTH_URL, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET } from "src/auth/constants";

jest.spyOn(global, "fetch");

jest.useFakeTimers();

const givenRefreshResponse = {
  access_token: "foo",
  id_token: "foo",
  expires_in: 3600,
};

describe("AuthService class tests", () => {
  let authService: AuthService;

  beforeAll(() => {
    authService = new AuthService();
  });

  describe("handleRefreshingTokens", () => {
    const givenResponseBody = {
      refresh_token: "foo",
    };

    test("should call fetch with passed code", async () => {
      const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // GIVEN the code from cognito is foo
      const refreshToken = "foo";

      // WHEN exchangeCodeWithTokens is called with the code
      let response = await authService.handleRefreshingTokens(refreshToken);

      // THEN it should be called with the expected fetch.
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(`refresh_token=${encodeURIComponent(refreshToken)}`),
        expect.any(Object)
      );

      // AND the response should be the expected response
      expect(response).toEqual(givenResponseBody);
    });

    test("Should call with correct basic authorization header", () => {
      const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // GIVEN the code from cognito is foo
      const refreshToken = "foo";

      // WHEN exchangeCodeWithTokens is called with the code
      authService.handleRefreshingTokens(refreshToken);

      // THEN it should be called with the expected fetch.
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic"),
          }),
        })
      );
    });

    test("should call the endpoint with POST method", () => {
      const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // GIVEN the code from cognito is foo
      const refreshToken = "foo";

      // WHEN exchangeCodeWithTokens is called with the code
      authService.handleRefreshingTokens(refreshToken);

      // THEN it should be called with the expected fetch.
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    test("When the fetch endpoint throws an error", async () => {
      // GIVEN the fetch endpoint throws an error
      setupFetchSpy(
        StatusCodes.INTERNAL_SERVER_ERROR,
        { message: "Internal Server Error" },
        "application/json;charset=UTF-8"
      ).mockRejectedValue(new Error("Internal Server Error"));

      // AND the code from cognito is foo
      const refreshToken = "foo";

      // WHEN exchangeCodeWithTokens is called with the code

      // THEN it should throw an error
      await expect(authService.handleRefreshingTokens(refreshToken)).toReject();
    });

    test("match snapshot", () => {
      const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // GIVEN the code from cognito is foo
      const refreshToken = "foo";

      // WHEN exchangeCodeWithTokens is called with the code
      authService.handleRefreshingTokens(refreshToken);

      // THEN it should be called with the expected fetch.
      expect(fetchSpy).toHaveBeenCalledWith(
        `${AUTH_URL}/oauth2/token?refresh_token=${encodeURIComponent(
          refreshToken
        )}&grant_type=refresh_token&client_id=${COGNITO_CLIENT_ID}`,
        {
          headers: {
            Authorization:
              "Basic " +
              window.btoa(`${encodeURIComponent(COGNITO_CLIENT_ID)}:${encodeURIComponent(COGNITO_CLIENT_SECRET)}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        }
      );
    });

    test("When no refreshToken is provided, it should throw an error", async () => {
      // GIVEN no code is provided
      const refreshToken = "undefined";

      // WHEN exchangeCodeWithTokens is called with the code

      // THEN it should throw an error
      await expect(authService.handleRefreshingTokens(refreshToken)).toReject();
    });

    it("should not throw an error when the status is 200", async () => {
      // GIVEN the fetch endpoint throws an error
      setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // AND the code from cognito is foo
      const refreshToken = "foo";

      // WHEN exchangeCodeWithTokens is called with the code

      // THEN it should not throw an error
      await expect(authService.handleRefreshingTokens(refreshToken)).resolves.toEqual(givenResponseBody);
    })

    it("should thrown an error when the status is 400", async () => {
      // GIVEN the fetch endpoint throws an error
      setupFetchSpy(StatusCodes.BAD_REQUEST, givenResponseBody, "application/json;charset=UTF-8");

      // AND the code from cognito is foo
      const refreshToken = "foo";

      // WHEN exchangeCodeWithTokens is called with the code

      // THEN it should throw an error
      await expect(authService.handleRefreshingTokens(refreshToken)).toReject();
    })

    it("should thrown an error when the status is 401", async () => {
      // GIVEN the fetch endpoint throws an error
      setupFetchSpy(StatusCodes.UNAUTHORIZED, givenResponseBody, "application/json;charset=UTF-8");

      // AND the code from cognito is foo
      const refreshToken = "foo";

      // WHEN exchangeCodeWithTokens is called with the code

      // THEN it should throw an error
      await expect(authService.handleRefreshingTokens(refreshToken)).toReject();
    })

    it("should thrown an error when the status is 500", async () => {
      // GIVEN the fetch endpoint throws an error
      setupFetchSpy(StatusCodes.INTERNAL_SERVER_ERROR, givenResponseBody, "application/json;charset=UTF-8");

      // AND the code from cognito is foo
      const refreshToken = "foo";

      // WHEN exchangeCodeWithTokens is called with the code

      // THEN it should throw an error
      await expect(authService.handleRefreshingTokens(refreshToken)).toReject();
    })
  });

  describe("exchangeCodeWithTokens", () => {
    const givenResponseBody = {
      refresh_token: "foo",
    };

    test("should call fetch with passed code", async () => {
      const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // GIVEN the code from cognito is foo
      const code = "foo";

      // WHEN exchangeCodeWithTokens is called with the code
      let response = await authService.exchangeCodeWithTokens(code);

      // THEN it should be called with the expected fetch.
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(`code=${encodeURIComponent(code)}`),
        expect.any(Object)
      );

      // AND the response should be the expected response
      expect(response).toEqual(givenResponseBody);
    });

    test("When no code is provided, it should throw an error", async () => {
      // GIVEN no code is provided
      const code = "undefined";

      // WHEN exchangeCodeWithTokens is called with the code

      // THEN it should throw an error
      await expect(authService.exchangeCodeWithTokens(code)).toReject();
    });

    test("Should call with correct basic authorization header", () => {
      const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // GIVEN the code from cognito is foo
      const code = "foo";

      // WHEN exchangeCodeWithTokens is called with the code
      authService.exchangeCodeWithTokens(code);

      // THEN it should be called with the expected fetch.
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic"),
          }),
        })
      );
    });

    test("should call the endpoint with POST method", () => {
      const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // GIVEN the code from cognito is foo
      const code = "foo";

      // WHEN exchangeCodeWithTokens is called with the code
      authService.exchangeCodeWithTokens(code);

      // THEN it should be called with the expected fetch.
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    test("When the fetch endpoint throws an error", async () => {
      // GIVEN the fetch endpoint throws an error
      setupFetchSpy(
        StatusCodes.INTERNAL_SERVER_ERROR,
        { message: "Internal Server Error" },
        "application/json;charset=UTF-8"
      ).mockRejectedValue(new Error("Internal Server Error"));

      // AND the code from cognito is foo
      const code = "foo";

      // WHEN exchangeCodeWithTokens is called with the code

      // THEN it should throw an error
      await expect(authService.exchangeCodeWithTokens(code)).toReject();
    });

    test("match snapshot", () => {
      const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // GIVEN the code from cognito is foo
      const code = "foo";

      // WHEN exchangeCodeWithTokens is called with the code
      authService.exchangeCodeWithTokens(code);

      // THEN it should be called with the expected fetch.
      expect(fetchSpy).toHaveBeenCalledWith(
        `${AUTH_URL}/oauth2/token?code=${encodeURIComponent(
          code
        )}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(
          window.location.origin
        )}/&client_id=${encodeURIComponent(COGNITO_CLIENT_ID)}`,
        {
          headers: {
            Authorization:
              "Basic " +
              window.btoa(`${encodeURIComponent(COGNITO_CLIENT_ID)}:${encodeURIComponent(COGNITO_CLIENT_SECRET)}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        }
      );
    });
  });

  describe("initiateRefreshTokens", () => {
    const givenSuccessCallback = jest.fn();
    const givenUnauthorizedCallback = jest.fn();

    it("should continue to call the handleRefreshingTokens with the refresh token", async () => {
      const handleRefreshingTokens = jest
        .spyOn(authService, "handleRefreshingTokens")
        .mockResolvedValue(givenRefreshResponse);

      expect(handleRefreshingTokens).toHaveBeenCalledTimes(0);
      expect(givenSuccessCallback).toHaveBeenCalledTimes(0);

      // GIVEN the refresh token is foo
      const givenRefreshToken = "foo";

      // WHEN initiateRefreshTokens is called with the refresh token
      await authService.initiateRefreshTokens(givenRefreshToken, givenSuccessCallback, givenUnauthorizedCallback);

      // AND it should call handleRefreshingTokens with the refresh token
      expect(handleRefreshingTokens).toHaveBeenCalledTimes(1);
      expect(givenSuccessCallback).toHaveBeenCalledTimes(1);

      const N = 10;

      // WHEN the interval is called at Nth time
      for (let i = 1; i < N; i++) {
        jest.advanceTimersByTime(givenRefreshResponse.expires_in * 1000 - givenRefreshResponse.expires_in * 1000 * 0.1);

        await Promise.resolve();

        // THEN it should call handleRefreshingTokens/callback with the refresh token
        expect(handleRefreshingTokens).toHaveBeenCalledTimes(1 + i); // 1 from the first call

        expect(givenSuccessCallback).toHaveBeenCalledTimes(1 + i); // 1 from the first cal
      }
    });

    it("should not call handleRefreshingTokens when there is already refreshing in progress", async () => {
      const handleRefreshingTokensSpy = jest
        .spyOn(authService, "handleRefreshingTokens")
        .mockResolvedValue(givenRefreshResponse);
      handleRefreshingTokensSpy.mockClear();

      // GIVEN the refresh token is foo
      const refreshToken = "foo";

      // WHEN initiateRefreshTokens is called with the refresh token
      await authService.initiateRefreshTokens(refreshToken, givenSuccessCallback, givenUnauthorizedCallback);

      // THEN handleRefreshingTokens should be called with the refresh token
      expect(handleRefreshingTokensSpy).toHaveBeenCalled();
      expect(handleRefreshingTokensSpy).toHaveBeenCalledWith(refreshToken);

      const TIMES_ELAPSED = 3;

      // WHEN the time elapses when the refreshing is in progress
      jest.advanceTimersByTime(
        TIMES_ELAPSED * (givenRefreshResponse.expires_in * 1000 - givenRefreshResponse.expires_in * 1000 * 0.1)
      );

      // THEN: the handleRefreshingTokens should not be called again
      expect(handleRefreshingTokensSpy.mock.calls.length).toBeLessThan(TIMES_ELAPSED);
    });

    it("should call handleRefreshingTokens with the refresh token", async () => {
      const handleRefreshingTokensSpy = jest
        .spyOn(authService, "handleRefreshingTokens")
        .mockResolvedValue(givenRefreshResponse);

      // GIVEN the refresh token is foo
      const refreshToken = "foo";

      // WHEN initiateRefreshTokens is called with the refresh token
      await authService.initiateRefreshTokens(refreshToken, givenSuccessCallback, givenUnauthorizedCallback);

      // THEN handleRefreshingTokens should be called with the refresh token
      expect(handleRefreshingTokensSpy).toHaveBeenCalled();
      expect(handleRefreshingTokensSpy).toHaveBeenCalledWith(refreshToken);
    });

    it("Should return a timer when the refreshing is initiated", async () => {
      jest.spyOn(authService, "handleRefreshingTokens").mockResolvedValue(givenRefreshResponse);

      // GIVEN the refresh token is foo
      const givenRefreshToken = "foo";

      // WHEN initiateRefreshTokens is called with the refresh token
      let timer = await authService.initiateRefreshTokens(
        givenRefreshToken,
        givenSuccessCallback,
        givenUnauthorizedCallback
      );

      // THEN it should return a timer
      // @ts-ignore
      expect(typeof timer).toBe("number");
    });

    it("Should call the given callback with the response from handleRefreshingTokens", async () => {
      jest.spyOn(authService, "handleRefreshingTokens").mockResolvedValue(givenRefreshResponse);

      // GIVEN the refresh token is foo
      const givenRefreshToken = "foo";

      // WHEN initiateRefreshTokens is called with the refresh token
      await authService.initiateRefreshTokens(givenRefreshToken, givenSuccessCallback, givenUnauthorizedCallback);

      // THEN the callback should be called with the response from handleRefreshingTokens
      expect(givenSuccessCallback).toHaveBeenCalledWith(givenRefreshResponse);
    });

    it("should call setInterval with the correct number", async () => {
      jest.spyOn(authService, "handleRefreshingTokens").mockResolvedValue(givenRefreshResponse);
      const setIntervalSpy = jest.spyOn(global, "setInterval").mockImplementation(jest.fn());

      // GIVEN the refresh token is foo
      const givenRefreshToken = "foo";

      // WHEN initiateRefreshTokens is called with the refresh token
      await authService.initiateRefreshTokens(givenRefreshToken, givenSuccessCallback, givenUnauthorizedCallback);

      const MARGIN = givenRefreshResponse.expires_in * 1000 * 0.1;

      // THEN it should call setInterval with the correct number (expires_in * 1000) * 0.1
      // @ts-ignore
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        givenRefreshResponse.expires_in * 1000 - MARGIN
      );
    });

    it("should call the unauthorized callback when the handleRefreshingTokens throws an error", async () => {
      jest.spyOn(authService, "handleRefreshingTokens").mockRejectedValue({ statusCode: 401 });

      // GIVEN the refresh token is foo
      const givenRefreshToken = "foo";

      // WHEN initiateRefreshTokens is called with the refresh token
      await authService.initiateRefreshTokens(givenRefreshToken, givenSuccessCallback, givenUnauthorizedCallback);

      // THEN the callback should be called with the response from handleRefreshingTokens
      expect(givenUnauthorizedCallback).toHaveBeenCalled();
    });

    it("should call unauthorized callback when the status is first 200 and then 401", async () => {
      jest.spyOn(authService, "handleRefreshingTokens").mockResolvedValue(givenRefreshResponse);

      // GIVEN the refresh token is foo
      const givenRefreshToken = "foo";

      // WHEN initiateRefreshTokens is called with the refresh token
      await authService.initiateRefreshTokens(givenRefreshToken, givenSuccessCallback, givenUnauthorizedCallback);

      // THEN the callback should be called with the response from handleRefreshingTokens
      expect(givenSuccessCallback).toHaveBeenCalled();

      // WHEN the handleRefreshingTokens throws an error
      jest.spyOn(authService, "handleRefreshingTokens").mockRejectedValue({ statusCode: 401 });

      // AND the time elapses
      jest.advanceTimersByTime(givenRefreshResponse.expires_in * 1000 - givenRefreshResponse.expires_in * 1000 * 0.1);

      // THEN it should call the unauthorized callback
      expect(givenUnauthorizedCallback).toHaveBeenCalled();
    });

    it("should should not call unauthorized callback when the status is internal server error", async () => {
      givenUnauthorizedCallback.mockClear();

      jest.spyOn(authService, "handleRefreshingTokens").mockResolvedValue(givenRefreshResponse);

      // GIVEN the refresh token is foo
      const givenRefreshToken = "foo";

      // WHEN initiateRefreshTokens is called with the refresh token
      await authService.initiateRefreshTokens(givenRefreshToken, givenSuccessCallback, givenUnauthorizedCallback);

      // THEN the callback should be called with the response from handleRefreshingTokens
      expect(givenSuccessCallback).toHaveBeenCalled();

      // WHEN the handleRefreshingTokens throws an error
      jest.spyOn(authService, "handleRefreshingTokens").mockRejectedValue({ status: 505 });

      // AND the time elapses
      jest.advanceTimersByTime(givenRefreshResponse.expires_in * 1000 - givenRefreshResponse.expires_in * 1000 * 0.1);

      // THEN it should call the unauthorized callback
      expect(givenUnauthorizedCallback).not.toHaveBeenCalled();
    });
  });
});
