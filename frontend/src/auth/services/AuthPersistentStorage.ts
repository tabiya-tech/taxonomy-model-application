export const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * This class is used to store the tokens in the session storage.
 *   eg: refresh token
 */
export class AuthPersistentStorage {
  static readonly storage = sessionStorage;

  /**
   * Sets the refresh token in the storage
   * @param refreshToken
   */
  static setRefreshToken(refreshToken: string): void {
    this.storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Returns the refresh token from the storage
   * @returns string | null - The refresh token
   */
  static getRefreshToken(): string | null {
    return this.storage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Clears the refresh token from the storage
   */
  static clearRefreshToken(): void {
    this.storage.removeItem(REFRESH_TOKEN_KEY)
  }

  /**
   * Clears the storage
   */
  static clear(): void {
    this.storage.clear()
  }
}
