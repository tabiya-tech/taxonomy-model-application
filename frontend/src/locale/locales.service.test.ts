import { getTestString } from "src/_test_utilities/specialCharacters";
import { setupAPIServiceSpy } from "src/_test_utilities/fetchSpy";
import { getArrayOfFakeLocales } from "src/locale/_test_utilities/mockLocales";
import { StatusCodes } from "http-status-codes/";
import { ServiceError } from "src/error/error";
import { ErrorCodes } from "src/error/errorCodes";
import LocalesService from "src/locale/locales.service";
import LocaleAPISpecs from "api-specifications/locale";

describe("LocalesService", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test("should construct the service successfully", () => {
    // GIVEN an api server url
    const apiServerUrl = getTestString(10);

    // WHEN the service is constructed
    const service = new LocalesService(apiServerUrl);

    // THEN expect the service to be constructed successfully
    expect(service.apiServerUrl).toEqual(apiServerUrl);
    expect(service.localesEndpointUrl).toEqual(`${apiServerUrl}/locales.json`);
  });

  test("should call the REST locales API at the correct URL, with GET", async () => {
    // GIVEN an api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the locales REST API will respond with OK status and some locales
    const givenResponse: LocaleAPISpecs.Types.Payload[] = getArrayOfFakeLocales(4);
    const fetchSpy = setupAPIServiceSpy(StatusCodes.OK, givenResponse, "application/json;charset=UTF-8");

    // WHEN the service is called
    const service = new LocalesService(givenApiServerUrl);
    const actualLocales = await service.getLocales();

    // THEN expect it to make a GET request with correct headers and payload
    expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/locales.json`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    // AND the response should be the expected locales
    expect(actualLocales).toEqual(givenResponse);
  });

  test("on fail to fetch, it should reject with an error ERROR_CODE.FAILED_TO_FETCH", async () => {
    // GIVEN fetch rejects with some unknown error
    const givenFetchError = new Error();
    jest.spyOn(window, "fetch").mockRejectedValue(givenFetchError);

    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // WHEN calling getLocales function
    const service = new LocalesService(givenApiServerUrl);
    const localesResponsePromise = service.getLocales();

    // THEN expected it to reject with the error response
    const expectedError = {
      ...new ServiceError(
        LocalesService.name,
        "getLocales",
        "GET",
        `${givenApiServerUrl}/locales.json`,
        0,
        ErrorCodes.FAILED_TO_FETCH,
        "",
        ""
      ),
      message: expect.any(String),
      details: expect.any(Error),
    };
    await expect(localesResponsePromise).rejects.toMatchObject(expectedError);
  });

  test.each([
    ["is a malformed json", "{"],
    ["is a string", "foo"],
    ["is not conforming to Locale Schema", [{ foo: "foo" }]],
  ])(
    "on 200, should reject with an error ERROR_CODE.INVALID_RESPONSE_BODY if response %s",
    async (_description, givenResponse) => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the REST API will respond with OK and some response that does conform to the LocalesSchema even if it states that it is application/json
      setupAPIServiceSpy(StatusCodes.OK, givenResponse, "application/json;charset=UTF-8");

      // WHEN the getLocales function is called
      const service = new LocalesService(givenApiServerUrl);
      const localesResponsePromise = service.getLocales();

      // THEN expect it to reject with the error response
      const expectedError = {
        ...new ServiceError(
          LocalesService.name,
          "getLocales",
          "GET",
          `${givenApiServerUrl}/locales.json`,
          StatusCodes.OK,
          ErrorCodes.INVALID_RESPONSE_BODY,
          "",
          ""
        ),
        message: expect.any(String),
        details: expect.anything(),
      };
      await expect(localesResponsePromise).rejects.toMatchObject(expectedError);
    }
  );

  test("on 200, should reject with an error ERROR_CODE.INVALID_RESPONSE_HEADER if the response Content-Type is not application/json;charset=UTF-8", async () => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the REST API will respond with OK and the content-type is not application/json;charset=UTF-8
    setupAPIServiceSpy(StatusCodes.OK, getArrayOfFakeLocales(4), "");

    // WHEN the getLocales function is called
    const service = new LocalesService(givenApiServerUrl);
    const localesResponsePromise = service.getLocales();

    // THEN expect it to reject with the error response
    const expectedError = {
      ...new ServiceError(
        LocalesService.name,
        "getLocales",
        "GET",
        `${givenApiServerUrl}/locales.json`,
        StatusCodes.OK,
        ErrorCodes.INVALID_RESPONSE_HEADER,
        "",
        ""
      ),
      message: expect.any(String),
      details: expect.anything(),
    };
    await expect(localesResponsePromise).rejects.toMatchObject(expectedError);
  });

  test("on NOT 200, it should reject with an error ERROR_CODE.API_ERROR", async () => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the REST API will respond with NOT OK status and some response body
    const givenResponse = { foo: "foo" };
    setupAPIServiceSpy(StatusCodes.NOT_FOUND, givenResponse, "application/json;charset=UTF-8");

    // WHEN the getLocales function is called
    const service = new LocalesService(givenApiServerUrl);
    const localesResponsePromise = service.getLocales();

    // THEN expect it to reject with the error response
    const expectedError = {
      ...new ServiceError(
        LocalesService.name,
        "getLocales",
        "GET",
        `${givenApiServerUrl}/locales.json`,
        StatusCodes.NOT_FOUND,
        ErrorCodes.API_ERROR,
        "",
        ""
      ),
      message: expect.any(String),
      details: expect.anything(),
    };
    await expect(localesResponsePromise).rejects.toMatchObject(expectedError);
  });
});
