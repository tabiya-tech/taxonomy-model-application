import { getEnv, getApiUrl } from "./envService";

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

test("getAPI should not fail if the BACKEND_URL is not set", () => {
  // GIVEN the BACKEND_URL environment variable is not set
  Object.defineProperty(window, "tabiyaConfig", {
    value: {},
    writable: true,
  });
  // WHEN getApiUrl is called
  const apiUrl = getApiUrl();
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

test("getApiUrl should return the API base URL", () => {
  // GIVEN the BACKEND_URL environment variable is set to a base64 encoded string
  const givenUrl = "https://SomeUrl.com/api";
  Object.defineProperty(window, "tabiyaConfig", {
    value: {
      BACKEND_URL: btoa(givenUrl),
    },
    writable: true,
  });
  // WHEN getApiUrl is called
  const apiUrl = getApiUrl();
  // THEN expect it to return the decoded BACKEND_URL
  expect(apiUrl).toBe(givenUrl);
});
