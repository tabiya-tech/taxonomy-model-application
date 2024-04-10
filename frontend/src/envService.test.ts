// silence chatty console
import "src/_test_utilities/consoleMock";
import {
  getEnv,
  getApiUrl,
  getLocalesUrl,
  getAuthUrl,
  getCognitoClientId,
  getCognitoClientSecretId,
} from "./envService";

test("getEnv should return the decoded environment variable value", () => {
  // GIVEN a key for an environment variable
  const key = "foo";
  // AND the environment variable is set to a base64 encoded string
  Object.defineProperty(window, "tabiyaConfig", {
    value: {
      foo: btoa("bar"),
    },
    writable: true,
  });
  // WHEN getEnv is called with the key
  const result = getEnv(key);
  // THEN expect the decoded URL to be returned
  expect(result).toBe("bar");
});

describe.each([
  ["BACKEND_URL", getApiUrl],
  ["LOCALES_URL", getLocalesUrl],
  ["AUTH_URL", getAuthUrl],
  ["COGNITO_CLIENT_ID", getCognitoClientId],
  ["COGNITO_CLIENT_SECRET", getCognitoClientSecretId],
])("Env Getters", (ENV_KEY, getterFn) => {
  describe(`${ENV_KEY} Getter (${getterFn.name}) tests`, () => {
    test(`getAPI should not fail if the ${ENV_KEY} is not set`, () => {
      // GIVEN the ENV_KEY environment variable is not set
      Object.defineProperty(window, "tabiyaConfig", {
        value: {},
        writable: true,
      });
      // WHEN getter Function is called
      const apiUrl = getterFn();
      // THEN expect it to return an empty string
      expect(apiUrl).toBe("");
    });

    test.each([
      ["undefined", undefined],
      ["null", null],
    ])("getEnv should handle a key with a %s value gracefully", (_description: string, value) => {
      // GIVEN a key for an environment variable
      const key = "foo";
      // AND the environment variable is set to an invalid base64 encoded string
      Object.defineProperty(window, "tabiyaConfig", {
        value: {
          foo: value,
        },
        writable: true,
      });
      // WHEN getEnv is called with the key
      const result = getEnv(key);
      // THEN expect an empty string to be returned
      expect(result).toBe("");
    });

    test(`${getterFn.name} should return the API base URL`, () => {
      // GIVEN the ENV_KEY environment variable is set to a base64 encoded string
      const givenUrl = "https://SomeUrl.com/api";
      Object.defineProperty(window, "tabiyaConfig", {
        value: {
          [ENV_KEY]: btoa(givenUrl),
        },
        writable: true,
      });
      // WHEN getter Function is called
      const expectedValue = getterFn();
      // THEN expect it to return the decoded ENV_KEY
      expect(expectedValue).toBe(givenUrl);
    });

    test("should handle base64 decoding errors gracefully", () => {
      // GIVEN the ENV KEY environment variable is set
      Object.defineProperty(window, "tabiyaConfig", {
        value: {
          [ENV_KEY]: "foo",
        },
        writable: true,
      });
      // AND the atob function will throw an error
      jest.spyOn(window, "atob").mockImplementationOnce(() => {
        throw new Error("atob error");
      });
      // WHEN getter Function is called
      const apiUrl = getterFn();
      // THEN expect it to return an empty string
      expect(apiUrl).toBe("");
      // AND expect an error to have been logged
      expect(console.error).toHaveBeenCalledWith("Error loading environment variable", expect.any(Error));
    });
  });
});
