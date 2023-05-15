// test the service
import Ajv from 'ajv/dist/2020';

import {getTestString} from "src/_test_utilities/specialCharacters";
import {randomUUID} from "crypto";
import ImportService, {INewModelSpecification} from "./import.service";
import {ErrorCodes} from "../error/errorCodes";

import {
  IModelInfoResponse,
  LocaleSchema,
  ModelInfoResponseSchema,
  ModelInfoRequestSchema,
  NAME_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, LOCALE_SHORTCODE_MAX_LENGTH, RELEASE_NOTES_MAX_LENGTH, VERSION_MAX_LENGTH
} from "api-specifications/modelInfo";
import addFormats from "ajv-formats";
import {ServiceError} from "../error/error";
import {StatusCodes} from "http-status-codes/";

function getNewModelSpecMockData(): INewModelSpecification {
  return {
    name: getTestString(NAME_MAX_LENGTH),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    locale: {
      name: getTestString(NAME_MAX_LENGTH),
      shortCode: getTestString(LOCALE_SHORTCODE_MAX_LENGTH),
      UUID: randomUUID()
    }
  }
}

const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
addFormats(ajv);
ajv.addSchema(LocaleSchema);
ajv.addSchema(ModelInfoRequestSchema);
ajv.addSchema(ModelInfoResponseSchema);
const validateResponse = ajv.compile(ModelInfoResponseSchema);

function getModelInfoMockResponse():IModelInfoResponse {
  const givenResponse: IModelInfoResponse = {
    id: getTestString(24),
    originUUID: "",
    previousUUID: "",
    path: getTestString(24),
    tabiyaPath: getTestString(24),
    UUID: randomUUID(),
    name: getTestString(NAME_MAX_LENGTH),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      shortCode: getTestString(LOCALE_SHORTCODE_MAX_LENGTH),
      name: getTestString(NAME_MAX_LENGTH),
    },
    released: false,
    releaseNotes: getTestString(RELEASE_NOTES_MAX_LENGTH),
    version: getTestString(VERSION_MAX_LENGTH),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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

  function setupFetchSpySuccessResponse(expectedResponseBody: any | string, contentType: "" | "application/json;charset=UTF-8"): jest.SpyInstance {
    const responseBody = typeof expectedResponseBody ==='string'? expectedResponseBody : JSON.stringify(expectedResponseBody);
    const expectedResponse = new Response(responseBody, {
      status: 201,
      headers: {"Content-Type": contentType}
    });
    return jest.spyOn(window, 'fetch').mockResolvedValue(expectedResponse);
  }

  function setupFetchSpyErrorResponse(expectedResponseBody: any): jest.SpyInstance {
    const expectedResponse = new Response(JSON.stringify(expectedResponseBody), {
      status: 400,
      headers: {"Content-Type": "application/json"}
    });
    return jest.spyOn(window, 'fetch').mockResolvedValue(expectedResponse);
  }

  test("should construct the service successfully", () => {
    // GIVEN an api server url
    const apiServerUrl = getTestString(10);

    // WHEN the service is constructed
    const service = new ImportService(apiServerUrl);

    // THEN expect the service to be constructed successfully
    expect(service).toBeDefined();

    // AND the service should have the correct api server url and create model endpoint url
    expect(service.apiServerUrl).toEqual(apiServerUrl);
    expect(service.createModelEndpointUrl).toEqual(`${apiServerUrl}/models`);
  });

  test("should call the REST createModel API at the correct URL, with POST and the correct headers and payload successfully", async () => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND a name, description, locale
    const givenModelSpec = getNewModelSpecMockData();
    // AND the create model REST API will respond with OK and some newly create model
    const givenResponse: IModelInfoResponse = getModelInfoMockResponse()
    const fetchSpy = setupFetchSpySuccessResponse(givenResponse, "application/json;charset=UTF-8");

    // WHEN the createModel function is called with the given arguments (name, description, ...)
    const service = new ImportService(givenApiServerUrl);

    await service.createModel(givenModelSpec);
    // THEN expect it to make a POST request
    // AND the headers
    // AND the request payload to contain the given arguments (name, description, ...)
    expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/models`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(givenModelSpec)
    });

    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);

    // AND the body conforms to the modelRequestSchema
    const validateRequest = ajv.compile(ModelInfoRequestSchema);
    validateRequest(payload);
    // @ts-ignore
    expect(validateResponse.errors).toBeNull();
  });

  test("on fail to fetch, it should reject with an error ERROR_CODE.FAILED_TO_FETCH", async () => {
      // GIVEN fetch rejects with some unknown error
      const givenFetchError = new Error();
      jest.spyOn(window, 'fetch').mockRejectedValue(givenFetchError);

      // WHEN calling create model function
      const service = new ImportService("/path/to/foo");

      // THEN expected it to reject with the error response
      const expectedError = {
        ...new ServiceError(ImportService.name, "createModel", "POST", "/path/to/foo/models", 0, ErrorCodes.FAILED_TO_FETCH, "", ""),
        message: expect.any(String),
        details: expect.any(Error)
      };
      await expect(service.createModel(getNewModelSpecMockData())).rejects.toMatchObject(expectedError);
    });

  test.each([
    ["is a malformed json", '{'],
    ["is a string", 'foo'],
    ["is not conforming to ModelResponseSchema", {foo: "foo"}],
  ])
  ("on 201, should reject with an error ERROR_CODE.INVALID_RESPONSE_BODY if response %s", async (description, givenResponse) => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the create model REST API will respond with OK and some response that does conform to the modelInfoResponseSchema even if it states that it is application/json
      setupFetchSpySuccessResponse(givenResponse, "application/json;charset=UTF-8");

      // WHEN the createModel function is called with the given arguments (name, description, ...)
      const service = new ImportService(givenApiServerUrl);

      // THEN expected it to reject with the error response
      const expectedError = {
        ...new ServiceError(ImportService.name, "createModel", "POST", `${givenApiServerUrl}/models`, StatusCodes.CREATED, ErrorCodes.INVALID_RESPONSE_BODY, "", ""),
        message: expect.any(String),
        details: expect.anything()
      };
      await expect(service.createModel(getNewModelSpecMockData())).rejects.toMatchObject(expectedError);
    });

  test("on 201, should reject with an error ERROR_CODE.INVALID_RESPONSE_HEADER if response content-type is not application/json;charset=UTF-8", async () => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the create model REST API will respond with OK and some response
    // that conforms to the modelInfoResponseSchema
    // but the content-type is not application/json;charset=UTF-8
    setupFetchSpySuccessResponse(getModelInfoMockResponse(), "");

    // WHEN the createModel function is called with the given arguments (name, description, ...)
    const service = new ImportService(givenApiServerUrl);

    // THEN expected it to reject with the error response
    const expectedError = {
      ...new ServiceError(ImportService.name, "createModel", "POST", `${givenApiServerUrl}/models`, StatusCodes.CREATED, ErrorCodes.INVALID_RESPONSE_HEADER, "", ""),
      message: expect.any(String),
      details: expect.any(String)
    };
    await expect(service.createModel(getNewModelSpecMockData())).rejects.toMatchObject(expectedError);
  });

  test("on NOT 201, it should reject with an error ERROR_CODE.API_ERROR that contains the body of the response", async () => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the create model REST API will respond with NOT OK and some response body
    const givenResponse = {foo: "foo", bar: "bar"};
    setupFetchSpyErrorResponse(givenResponse);

    // WHEN the createModel function is called with the given arguments (name, description, ...)
    const service = new ImportService(givenApiServerUrl);

    // THEN expected it to reject with the error response
    const expectedError = {
      ...new ServiceError(ImportService.name, "createModel", "POST", `${givenApiServerUrl}/models`, 0, ErrorCodes.API_ERROR, "", givenResponse),
      statusCode:expect.any(Number),
      message: expect.any(String),
      details: givenResponse
    };
    await expect(service.createModel(getNewModelSpecMockData())).rejects.toMatchObject(expectedError);
  });
});

