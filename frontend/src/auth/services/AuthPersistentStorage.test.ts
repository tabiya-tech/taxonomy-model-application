import { AuthPersistentStorage } from "./AuthPersistentStorage"

describe("AuthPersistentStorage class tests", () => {
  beforeEach(() => {
    AuthPersistentStorage.clear();
  })

  afterAll(() => {
    AuthPersistentStorage.clear();
  })

  test("return correct previously set token refresh token", () => {
    // GIVEN The refresh token is stored in the session storage
    const givenRefreshToken = "foo"
    AuthPersistentStorage.setRefreshToken(givenRefreshToken)

    // WHEN The refresh token is retrieved
    const refreshToken = AuthPersistentStorage.getRefreshToken()

    // THEN The refresh token should be returned
    expect(refreshToken).toEqual(givenRefreshToken)
  });

  test("return null if refresh token is not set", () => {
    // GIVEN The refresh token is not stored in the session storage
    // Nothing set

    // WHEN The refresh token is retrieved
    const refreshToken = AuthPersistentStorage.getRefreshToken()

    // THEN null should be returned
    expect(refreshToken).toBeNull()
  })

  test("clear refresh token", () => {
    // GIVEN The refresh token is stored in the session storage
    const givenRefresh = "foo"
    AuthPersistentStorage.setRefreshToken(givenRefresh)

    // WHEN The refresh token is cleared
    AuthPersistentStorage.clearRefreshToken()

    // THEN The refresh token should be cleared (null)
    const refreshToken = AuthPersistentStorage.getRefreshToken()
    expect(refreshToken).toBeNull()
  })

  test("clear all tokens", () => {
    // GIVEN The refresh token is stored in the session storage
    const givenRefresh = "foo"
    AuthPersistentStorage.setRefreshToken(givenRefresh)

    // WHEN The refresh token is cleared
    AuthPersistentStorage.clear()

    // THEN The refresh token should be cleared (null)
    const refreshToken = AuthPersistentStorage.getRefreshToken()
    expect(refreshToken).toBeNull()
  })
});
