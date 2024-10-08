// Mute chatty console output during tests
import "_test_utilities/consoleMock";

import "jest-performance-matchers";

import { redactCredentialsFromURI } from "./redactCredentialsFromURI";

describe("test the redactCredentialsFromURI function", () => {
  describe("test typical uri", () => {
    test.each([
      ["http://foo.bar"], // NOSONAR
      ["http://foo/bar"], // NOSONAR
      ["http://foo/bar?baz=qux"], // NOSONAR
      ["https://example.com:8080"], // NOSONAR
      ["mongodb://example.com:8080/"], // NOSONAR
    ])("should return the same URI %s if no credentials are present", (uri: string) => {
      const result = redactCredentialsFromURI(uri);
      expect(result).toEqual(uri);
    });

    test.each([
      ["http://user:password@foo.bar", "http://*:*@foo.bar"], // NOSONAR
      ["http://user:password@foo/bar", "http://*:*@foo/bar"], // NOSONAR
      ["http://user:password@foo/bar?baz=qux", "http://*:*@foo/bar?baz=qux"], // NOSONAR
      ["https://user:password@example.com:8080", "https://*:*@example.com:8080"], // NOSONAR
      ["mongodb://user:password@example.com:8080/", "mongodb://*:*@example.com:8080/"], // NOSONAR
      ["mongodb://user%40domain:password@example.com:8080/", "mongodb://*:*@example.com:8080/"], // NOSONAR
    ])("should return the redacted URI %s if credentials are present", (uriWithCredentials, uriWithoutCredential) => {
      const result = redactCredentialsFromURI(uriWithCredentials);
      expect(result).toEqual(uriWithoutCredential);
    });
  });
  describe("test credentials are malformed", () => {
    test.each([
      ["//user:password@foo.bar", "//*:*@foo.bar"],
      ["://user:password@foo/bar", "://*:*@foo/bar"],
      ["http://user:@foo/bar?baz=qux", "http://*:*@foo/bar?baz=qux"], // NOSONAR
      ["https://user@example.com:8080", "https://*:*@example.com:8080"],
      ["mongodb://:password@example.com:8080/", "mongodb://*:*@example.com:8080/"], // NOSONAR
      ["mongodb:// @example.com:8080/", "mongodb://*:*@example.com:8080/"], // NOSONAR
      ["mongodb://:@example.com:8080/", "mongodb://*:*@example.com:8080/"], // NOSONAR
    ])("should return the redacted URI %s if credentials are malformed", (uriWithCredentials, uriWithoutCredential) => {
      const result = redactCredentialsFromURI(uriWithCredentials);
      expect(result).toEqual(uriWithoutCredential);
    });
  });

  describe("test function performance", () => {
    const PERF_DURATION = 15;
    const ITERATIONS = 15;
    const QUANTILE = 90;
    test.each([
      ["plain http", "http://foo/bar?baz=qux"], // NOSONAR
      ["http with credentials", "http://username:password@foo/bar?baz=qux"], // NOSONAR
      ["only username", "http://username:@foo/bar?baz=qux"], // NOSONAR
      ["only password", "http://:@foo/bar?baz=qux"], // NOSONAR
      ["(extreme long) plain http", "http://foo/bar?baz=" + "qux".repeat(65535)], // NOSONAR
      [
        "(extreme long) with credentials ",
        "http://" + "username".repeat(32000) + ":" + "password".repeat(32000) + "@foo/bar?baz=" + "qux".repeat(65535), // NOSONAR
      ],
      ["(extreme long) only username ", "http://" + "username".repeat(32000) + "@foo/bar?baz=" + "qux".repeat(65535)], // NOSONAR
      ["(extreme long) only password ", "http://:" + "username".repeat(32000) + "@foo/bar?baz=" + "qux".repeat(65535)], // NOSONAR
      [
        "(extreme long) with multiple user name passwords",
        "http://:" + "username:password".repeat(32000) + "@foo/bar?baz=" + "qux".repeat(65535), // NOSONAR
      ],
    ])(
      `It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`,
      (description, uri) => {
        expect(() => {
          redactCredentialsFromURI(uri);
        }).toCompleteWithinQuantile(PERF_DURATION, {
          iterations: ITERATIONS,
          quantile: QUANTILE,
        });
      }
    );
  });
});
