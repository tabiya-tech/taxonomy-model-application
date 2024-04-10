import { fetchWithAuth } from "./APIService";

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

  jest.spyOn(global, "fetch").mockResolvedValue("fetch response" as unknown as Response);

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
  expect(response).toBe("fetch response");
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

  // Mock implementation of fetch
  jest.spyOn(global, "fetch").mockResolvedValue("fetch response without token" as unknown as Response);

  // WHEN fetchWithAuth is called with an apiUrl
  const response = await fetchWithAuth(givenApiUrl);

  // THEN expect fetch to have been called without an Authorization header
  expect(global.fetch).toHaveBeenCalledWith(
    givenApiUrl,
    expect.not.objectContaining({
      headers: {
        map:
          expect.any(Headers) &&
          expect.objectContaining({
            authorization: expect.anything(),
          }),
      },
    })
  );
  expect(response).toBe("fetch response without token");
});
