// test the service
import Ajv from 'ajv/dist/2020';

import {getTestString} from "src/_test_utilities/specialCharacters";

import {ErrorCodes} from "src/error/errorCodes";

import {
  PresignedResponseSchema,
  IPresignedResponse
} from "api-specifications/presigned";
import {ServiceError} from "src/error/error";
import {StatusCodes} from "http-status-codes/";
import PresignedService from "./presigned.service";
import addFormats from "ajv-formats";
import {setupFetchSpy} from "src/_test_utilities/fetchSpy";


const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
addFormats(ajv);
const validateResponse = ajv.compile(PresignedResponseSchema);

function getPresignedMockResponse(): IPresignedResponse {
  const givenResponse: IPresignedResponse = {
    url: "https://somedomain/somepath",
    fields: [{name: "someName", value: "someValue"}, {name: "someOtherName", value: "someOtherValue"}],
    key: getTestString(10)
  }
  // guard against invalid response
  validateResponse(givenResponse);
  expect(validateResponse.errors).toBeNull();
  return givenResponse;
}

describe("Test the service", () => {

  afterEach(() => {
    jest.restoreAllMocks();
  });


  test("should construct the service successfully", () => {
    // GIVEN an api server url
    const apiServerUrl = getTestString(10);

    // WHEN the service is constructed
    const service = new PresignedService(apiServerUrl);

    // THEN expect the service to be constructed successfully
    expect(service).toBeDefined();

    // AND the service should have the correct api server url and endpoint url
    expect(service.apiServerUrl).toEqual(apiServerUrl);
    expect(service.presignedEndpointUrl).toEqual(`${apiServerUrl}/presigned`);
  });

  test("should call the REST presigned API at the correct URL, with GET", async () => {
    // GIVEN an api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the presigned REST API will respond with OK and some newly created presigned data
    const givenResponse: IPresignedResponse = getPresignedMockResponse()
    const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponse, "application/json;charset=UTF-8");

    // WHEN the getPresignedPost function is called
    const service = new PresignedService(givenApiServerUrl);

    await service.getPresignedPost();
    // THEN expect it to make a GET request
    // AND the headers
    // AND the request payload to contain the given arguments (name, description, ...)
    expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/presigned`, {
      method: "GET",
      body: undefined,
    });
  });

  test("on fail to fetch, it should reject with an error ERROR_CODE.FAILED_TO_FETCH", async () => {
    // GIVEN fetch rejects with some unknown error
    const givenFetchError = new Error();
    jest.spyOn(window, 'fetch').mockRejectedValue(givenFetchError);

    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api"
    // WHEN calling getPresignedPost function
    const service = new PresignedService(givenApiServerUrl);
    const presignedResponsePromise = service.getPresignedPost();

    // THEN expected it to reject with the error response
    const expectedError = {
      ...new ServiceError(PresignedService.name, "getPresignedPost", "GET", `${givenApiServerUrl}/presigned`, 0, ErrorCodes.FAILED_TO_FETCH, "", ""),
      message: expect.any(String),
      details: expect.any(Error)
    };
    await expect(presignedResponsePromise).rejects.toMatchObject(expectedError);
  });

  test.each([
    ["is a malformed json", '{'],
    ["is a string", 'foo'],
    ["is not conforming to PresignedResponseSchema", {foo: "foo"}],
  ])
  ("on 200, should reject with an error ERROR_CODE.INVALID_RESPONSE_BODY if response %s", async (description, givenResponse) => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the REST API will respond with OK and some response that does conform to a JSON even if it states that it is application/json
    setupFetchSpy(StatusCodes.OK, givenResponse, "application/json;charset=UTF-8");

    // WHEN the getPresignedPost function is called
    const service = new PresignedService(givenApiServerUrl);
    const presignedResponsePromise = service.getPresignedPost();

    // THEN expected it to reject with the error response
    const expectedError = {
      ...new ServiceError(PresignedService.name, "getPresignedPost", "GET", `${givenApiServerUrl}/presigned`, StatusCodes.OK, ErrorCodes.INVALID_RESPONSE_BODY, "", ""),
      message: expect.any(String),
      details: expect.anything()
    };
    await expect(presignedResponsePromise).rejects.toMatchObject(expectedError);
  });

  test("on 200, should reject with an error ERROR_CODE.INVALID_RESPONSE_HEADER if response content-type is not application/json;charset=UTF-8", async () => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the  REST API will respond with OK and some response
    // that conforms to the PresignedResponseSchema
    // but the content-type is not application/json;charset=UTF-8
    setupFetchSpy(StatusCodes.OK, getPresignedMockResponse(), "");

    // WHEN the getPresignedPost function is called
    const service = new PresignedService(givenApiServerUrl);
    const presignedResponsePromise = service.getPresignedPost();

    // THEN expected it to reject with the error response
    const expectedError = {
      ...new ServiceError(PresignedService.name, "getPresignedPost", "GET", `${givenApiServerUrl}/presigned`, StatusCodes.OK, ErrorCodes.INVALID_RESPONSE_HEADER, "", ""),
      message: expect.any(String),
      details: expect.any(String)
    };
    await expect(presignedResponsePromise).rejects.toMatchObject(expectedError);
  });

  test("on NOT 200, it should reject with an error ERROR_CODE.API_ERROR that contains the body of the response", async () => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the REST API will respond with NOT OK and some response body
    const givenResponse = {foo: "foo", bar: "bar"};
    setupFetchSpy(StatusCodes.BAD_REQUEST, givenResponse, "application/json;charset=UTF-8");


    // WHEN the getPresignedPost function is called
    const service = new PresignedService(givenApiServerUrl);
    const presignedResponsePromise = service.getPresignedPost();

    // THEN expected it to reject with the error response
    const expectedError = {
      ...new ServiceError(PresignedService.name, "getPresignedPost", "GET", `${givenApiServerUrl}/presigned`, 0, ErrorCodes.API_ERROR, "", givenResponse),
      statusCode: expect.any(Number),
      message: expect.any(String),
      details: givenResponse
    };
    await expect(presignedResponsePromise).rejects.toMatchObject(expectedError);
  });
});

