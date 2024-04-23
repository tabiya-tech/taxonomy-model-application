import { fetchWithAuth } from "./APIService";
import { setupFetchSpy } from "src/_test_utilities/fetchSpy";
import { ServiceError } from "src/error/error";
import { ErrorCodes } from "src/error/errorCodes";

beforeEach(() => {
  jest.clearAllMocks();
});

test("fetchWithAuth should add Authorization header when authToken is present", async () => {
  // GIVEN an API URL and a valid auth token in sessionStorage
  const givenApiUrl = "https://api.example.com/data";
  const givenToken = "someAuthToken";

  jest.spyOn(global, "sessionStorage", "get").mockImplementation(
    () =>
      ({
        getItem: jest.fn().mockReturnValue(givenToken),
      }) as unknown as Storage
  );

  // AND the server responds with a 200 status code
  setupFetchSpy(200, "fetch response", "application/json;charset=UTF-8");

  // WHEN fetchWithAuth is called with an api url
  const response = await fetchWithAuth(givenApiUrl);

  // THEN expect fetch to have been called with the correct arguments
  expect(global.fetch).toHaveBeenCalledWith(
    givenApiUrl,
    expect.objectContaining({
      headers: {
        map:
          expect.any(Headers) &&
          expect.objectContaining({
            authorization: `Bearer ${givenToken}`,
          }),
      },
    })
  );
  // AND expect the response to be the expected response
  expect(response.status).toBe(200);
});

test("fetchWithAuth should work without authToken", async () => {
  // GIVEN an API URL and no auth token in sessionStorage
  const givenApiUrl = "https://api.example.com/data";
  jest.spyOn(global, "sessionStorage", "get").mockImplementation(
    () =>
      ({
        getItem: jest.fn().mockReturnValue(null),
      }) as unknown as Storage
  );

  // AND the server responds with a 200 status code
  setupFetchSpy(200, "fetch response without token", "application/json;charset=UTF-8");

  // WHEN fetchWithAuth is called with an apiUrl
  const response = await fetchWithAuth(givenApiUrl);

  // THEN expect fetch to have been called without an Authorization header
  expect(global.fetch).toHaveBeenCalledWith(
    givenApiUrl,
    expect.objectContaining({
      headers: {
        map:
          expect.any(Headers) &&
          expect.objectContaining({
            authorization: `Bearer ANONYMOUS`,
          }),
      },
    })
  );
  expect(response.status).toBe(200);
});

test("fetchWithAuth should throw an error if the server responds with an unexpected status code", async () => {
  // GIVEN an API URL and a valid auth token in sessionStorage
  const givenApiUrl = "https://api.example.com/data";
  const givenAuthToken = "someAuthToken";
  const givenServiceName = "Some service";
  const givenServiceFunction = "Some function";
  const givenMethod = "GET";
  const givenFailureMessage = "fetchWithAuth failed";

  jest.spyOn(global, "sessionStorage", "get").mockImplementation(
    () =>
      ({
        getItem: jest.fn().mockReturnValue(givenAuthToken),
      }) as unknown as Storage
  );

  // AND the server responds with a 404 status code
  setupFetchSpy(404, "Not Found", "application/json;charset=UTF-8");

  // WHEN fetchWithAuth is called with an apiUrl and an init configuration
  let error: Error | undefined;
  try {
    await fetchWithAuth(givenApiUrl, {
      expectedStatusCode: 200,
      serviceName: givenServiceName,
      serviceFunction: givenServiceFunction,
      method: givenMethod,
      failureMessage: givenFailureMessage,
    });
  } catch (e) {
    error = e as Error;
  }

  // THEN expect an error to have been thrown
  expect(error).toBeDefined();
  expect(error).toBeInstanceOf(ServiceError);
  expect(error?.message).toBe("fetchWithAuth failed");
  expect(error as ServiceError).toMatchObject({
    serviceName: givenServiceName,
    serviceFunction: givenServiceFunction,
    method: givenMethod,
    path: givenApiUrl,
    statusCode: 404,
    errorCode: ErrorCodes.API_ERROR,
    details: "Not Found",
  });
});

test("fetchWithAuth should throw an error if the server responds with an unexpected Content-Type", async () => {
  // GIVEN an API URL and a valid auth token in sessionStorage
  const givenApiUrl = "https://api.example.com/data";
  const givenAuthToken = "someAuthToken";
  const givenServiceName = "Some service";
  const givenServiceFunction = "Some function";
  const givenMethod = "GET";
  const givenFailureMessage = "fetchWithAuth failed";

  jest.spyOn(global, "sessionStorage", "get").mockImplementation(
    () =>
      ({
        getItem: jest.fn().mockReturnValue(givenAuthToken),
      }) as unknown as Storage
  );

  // AND the server responds with an XML response
  // @ts-ignore
  setupFetchSpy(200, "fetch response", "application/xml;charset=UTF-8");

  // WHEN fetchWithAuth is called with an apiUrl and an init configuration
  let error: Error | undefined;
  try {
    await fetchWithAuth(givenApiUrl, {
      expectedStatusCode: 200,
      serviceName: givenServiceName,
      serviceFunction: givenServiceFunction,
      method: givenMethod,
      failureMessage: givenFailureMessage,
      expectedContentType: "application/json", // This is the expected Content-Type
    });
  } catch (e) {
    error = e as Error;
  }

  // THEN expect an error to have been thrown
  expect(error).toBeDefined();
  expect(error).toBeInstanceOf(ServiceError);
  expect(error?.message).toBe("Response Content-Type should be 'application/json'");
  expect(error as ServiceError).toMatchObject({
    serviceName: givenServiceName,
    serviceFunction: givenServiceFunction,
    method: givenMethod,
    path: givenApiUrl,
    statusCode: 200,
    errorCode: "INVALID_RESPONSE_HEADER",
    details: "Content-Type header was application/xml;charset=UTF-8",
  });
});

test("fetchWithAuth should allow all Content-Types if expectedContentType is not provided", async () => {
  // GIVEN an API URL and a valid auth token in sessionStorage
  const givenApiUrl = "https://api.example.com/data";
  const givenAuthToken = "someAuthToken";
  const givenServiceName = "Some service";
  const givenServiceFunction = "Some function";
  const givenMethod = "GET";
  const givenFailureMessage = "fetchWithAuth failed";

  jest.spyOn(global, "sessionStorage", "get").mockImplementation(
    () =>
      ({
        getItem: jest.fn().mockReturnValue(givenAuthToken),
      }) as unknown as Storage
  );

  // AND the server responds with an XML response
  // @ts-ignore
  setupFetchSpy(200, "fetch response", "application/xml;charset=UTF-8");

  // WHEN fetchWithAuth is called with an apiUrl and an init configuration
  const response = await fetchWithAuth(givenApiUrl, {
    expectedStatusCode: 200,
    serviceName: givenServiceName,
    serviceFunction: givenServiceFunction,
    method: givenMethod,
    failureMessage: givenFailureMessage,
  });

  // THEN expect the response to be the expected response
  expect(response.status).toBe(200);
});

test("fetchWithAuth should throw an error if the fetch fails", async () => {
  // GIVEN an API URL and a valid auth token in sessionStorage
  const givenApiUrl = "https://api.example.com/data";
  const givenAuthToken = "someAuthToken";
  const givenServiceName = "Some service";
  const givenServiceFunction = "Some function";
  const givenMethod = "GET";
  const givenFailureMessage = "fetchWithAuth failed";

  jest.spyOn(global, "sessionStorage", "get").mockImplementation(
    () =>
      ({
        getItem: jest.fn().mockReturnValue(givenAuthToken),
      }) as unknown as Storage
  );

  // AND fetch fails
  jest.spyOn(global, "fetch").mockRejectedValue(new Error("Failed to fetch"));

  // WHEN fetchWithAuth is called with an apiUrl and an init configuration
  let error: Error | undefined;
  try {
    await fetchWithAuth(givenApiUrl, {
      expectedStatusCode: 200,
      serviceName: givenServiceName,
      serviceFunction: givenServiceFunction,
      method: givenMethod,
      failureMessage: givenFailureMessage,
    });
  } catch (e) {
    error = e as Error;
  }

  // THEN expect an error to have been thrown
  expect(error).toBeDefined();
  expect(error).toBeInstanceOf(ServiceError);
  expect(error?.message).toBe("fetchWithAuth failed");
  expect(error as ServiceError).toMatchObject({
    serviceName: givenServiceName,
    serviceFunction: givenServiceFunction,
    method: givenMethod,
    path: givenApiUrl,
    statusCode: 0,
    errorCode: "FAILED_TO_FETCH",
    details: new Error("Failed to fetch"),
  });
});
