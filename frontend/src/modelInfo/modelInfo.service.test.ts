import ModelInfoService, {INewModelSpecification} from "./modelInfo.service";
import {getTestString} from "src/_test_utilities/specialCharacters";
import ModelInfo from "api-specifications/modelInfo"
import Locale from "api-specifications/locale";
import * as MockPayload from "./_test_utilities/mockModelInfoPayload";
import {StatusCodes} from "http-status-codes";
import {setupFetchSpy} from "src/_test_utilities/fetchSpy";
import {ServiceError} from "src/error/error";
import {ErrorCodes} from "src/error/errorCodes";
import {randomUUID} from "crypto";
import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";

function getNewModelSpecMockData(): INewModelSpecification {
  return {
    name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH), description: getTestString(ModelInfo.Constants.DESCRIPTION_MAX_LENGTH), locale: {
      name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH), shortCode: getTestString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH), UUID: randomUUID()
    }
  }
}

describe("ModelInfoService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should construct the service successfully", () => {
    // GIVEN an api server url
    const givenApiServerUrl = getTestString(10);

    // WHEN the service is constructed
    const service = new ModelInfoService(givenApiServerUrl);

    // THEN expect the service to be constructed successfully
    expect(service).toBeDefined();

    // AND the service should have the correct endpoint url
    expect(service.apiServerUrl).toEqual(givenApiServerUrl);
    expect(service.modelInfoEndpointUrl).toEqual(`${givenApiServerUrl}/models`);
  });

  describe("getModels", () => {
    test("getAllModels() should call the REST API at the correct URL, with GET and the correct headers and payload successfully", async () => {
      // GIVEN an api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the GET models REST API will respond with OK and some models
      const givenResponseBody: ModelInfo.GET.Response.Payload = MockPayload.GET.getPayloadWithArrayOfRandomModelInfo(2);
      const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // WHEN the getAllModels function is called with the given arguments
      const service = new ModelInfoService(givenApiServerUrl);
      const actualModels = await service.getAllModels();

      // THEN expect it to make a GET request with correct headers and payload
      expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/models`, {
        method: "GET", headers: {}
      });

      // AND expect it to return all the model the response contains
      expect(actualModels.length).toEqual(givenResponseBody.length);
      givenResponseBody.forEach((givenModel, index) => {
        expect(actualModels[index]).toEqual({
          ...givenModel, createdAt: new Date(givenModel.createdAt), updatedAt: new Date(givenModel.updatedAt)
        }); // currently we do not transform the response, so it should be the same
      });
    });

    test("on fail to fetch, getAllModels() should reject with an error ERROR_CODE.FAILED_TO_FETCH", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND fetch rejects with some unknown error
      const givenFetchError = new Error();
      jest.spyOn(window, 'fetch').mockRejectedValue(givenFetchError);

      // WHEN calling getAllModels function
      const service = new ModelInfoService(givenApiServerUrl);

      // THEN expected it to reject with the error response
      const expectedError = {
        ...new ServiceError(ModelInfoService.name, "getAllModels", "GET", `${givenApiServerUrl}/models`, 0, ErrorCodes.FAILED_TO_FETCH, "", ""), message: expect.any(String), details: expect.any(Error)
      };
      await expect(service.getAllModels()).rejects.toMatchObject(expectedError);
    });

    test.each([["is a malformed json", '{'], ["is a string", 'foo'], ["is not conforming to ModelResponseSchema", {foo: "foo"}],])("on 200, getAllModels() should reject with an error ERROR_CODE.INVALID_RESPONSE_BODY if response %s", async (description, givenResponse) => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the GET models REST API will respond with OK and some response that does conform to the modelInfoResponseSchema even if it states that it is application/json
      setupFetchSpy(StatusCodes.OK, givenResponse, "application/json;charset=UTF-8");

      // WHEN the getAllModels function is called
      const service = new ModelInfoService(givenApiServerUrl);
      const getAllModelsPromise = service.getAllModels();

      // THEN expect it to reject with the error response
      const expectedError = {
        ...new ServiceError(ModelInfoService.name, "getAllModels", "GET", `${givenApiServerUrl}/models`, StatusCodes.OK, ErrorCodes.INVALID_RESPONSE_BODY, "", ""), message: expect.any(String), details: expect.anything()
      };
      await expect(getAllModelsPromise).rejects.toMatchObject(expectedError);
    });

    test("on 200, getAllModels() should reject with an error ERROR_CODE.INVALID_RESPONSE_HEADER if response content-type is not application/json;charset=UTF-8", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the GET models REST API will respond with OK and some response that
      // that conforms to the modelInfoResponseSchemaGET
      // but the content-type is not application/json;charset=UTF-8
      setupFetchSpy(StatusCodes.OK, MockPayload.GET.getPayloadWithArrayOfRandomModelInfo(1), "");

      // WHEN the getAllModels function is called
      const service = new ModelInfoService(givenApiServerUrl);
      const getAllModelsPromise = service.getAllModels();

      // THEN expect it to reject with the error response
      const expectedError = {
        ...new ServiceError(ModelInfoService.name, "getAllModels", "GET", `${givenApiServerUrl}/models`, StatusCodes.OK, ErrorCodes.INVALID_RESPONSE_HEADER, "", ""), message: expect.any(String), details: expect.anything()
      };
      await expect(getAllModelsPromise).rejects.toMatchObject(expectedError);
    });

    test("on NOT 200, getAllModels() should reject with an error ERROR_CODE.API_ERROR that contains the body of the response", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the create model REST API will respond with NOT OK and some response body
      const givenResponse = {foo: "foo", bar: "bar"};
      setupFetchSpy(StatusCodes.BAD_REQUEST, givenResponse, "application/json;charset=UTF-8");

      // WHEN the getAllModels function is called
      const service = new ModelInfoService(givenApiServerUrl);
      const getAllModelsPromise = service.getAllModels();

      // THEN expect it to reject with the error response
      const expectedError = {
        ...new ServiceError(ModelInfoService.name, "getAllModels", "GET", `${givenApiServerUrl}/models`, 0, ErrorCodes.API_ERROR, "", givenResponse), statusCode: expect.any(Number), message: expect.any(String), details: givenResponse
      };
      await expect(getAllModelsPromise).rejects.toMatchObject(expectedError);
    });
  });

  describe("createModel", () => {

    const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    addFormats(ajv);
    ajv.addSchema(Locale.Schema);
    ajv.addSchema(ModelInfo.POST.Request.Schema);
    ajv.addSchema(ModelInfo.POST.Response.Schema);
    const validateResponse = ajv.compile(ModelInfo.POST.Response.Schema);

    test("should call the REST createModel API at the correct URL, with POST and the correct headers and payload successfully", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND a name, description, locale
      const givenModelSpec = getNewModelSpecMockData();
      // AND the create model REST API will respond with OK and some newly create model
      const givenResponseBody: ModelInfo.POST.Response.Payload = MockPayload.POST.getPayloadWithOneRandomModelInfo();
      const fetchSpy = setupFetchSpy(StatusCodes.CREATED, givenResponseBody, "application/json;charset=UTF-8");

      // WHEN the createModel function is called with the given arguments (name, description, ...)
      const service = new ModelInfoService(givenApiServerUrl);

      const actualCreatedModel = await service.createModel(givenModelSpec);
      // THEN expect it to make a POST request
      // AND the headers
      // AND the request payload to contain the given arguments (name, description, ...)
      expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/models`, {
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(givenModelSpec)
      });

      const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);

      // AND the body conforms to the modelRequestSchema
      const validateRequest = ajv.compile(ModelInfo.POST.Request.Schema);
      validateRequest(payload);
      // @ts-ignore
      expect(validateResponse.errors).toBeNull();

      // AND returns the newly created model
      expect(actualCreatedModel).toEqual({
        ...givenResponseBody,
        createdAt: new Date(givenResponseBody.createdAt),
        updatedAt: new Date(givenResponseBody.updatedAt),
      });
    });

    test("on fail to fetch, it should reject with an error ERROR_CODE.FAILED_TO_FETCH", async () => {
      // GIVEN fetch rejects with some unknown error
      const givenFetchError = new Error();
      jest.spyOn(window, 'fetch').mockRejectedValue(givenFetchError);

      // WHEN calling create model function
      const service = new ModelInfoService("/path/to/foo");

      // THEN expected it to reject with the error response
      const expectedError = {
        ...new ServiceError(ModelInfoService.name, "createModel", "POST", "/path/to/foo/models", 0, ErrorCodes.FAILED_TO_FETCH, "", ""), details: expect.any(Error)
      };
      await expect(service.createModel(getNewModelSpecMockData())).rejects.toMatchObject(expectedError);
    });

    test.each([["is a malformed json", '{'], ["is a string", 'foo'], ["is not conforming to ModelResponseSchema", {foo: "foo"}],])("on 201, should reject with an error ERROR_CODE.INVALID_RESPONSE_BODY if response %s", async (description, givenResponse) => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the create model REST API will respond with OK and some response that does conform to the modelInfoResponseSchema even if it states that it is application/json
      setupFetchSpy(StatusCodes.CREATED, givenResponse, "application/json;charset=UTF-8");

      // WHEN the createModel function is called with the given arguments (name, description, ...)
      const service = new ModelInfoService(givenApiServerUrl);
      const createModelPromise = service.createModel(getNewModelSpecMockData());

      // THEN expected it to reject with the error response
      const expectedError = {
        ...new ServiceError(ModelInfoService.name, "createModel", "POST", `${givenApiServerUrl}/models`, StatusCodes.CREATED, ErrorCodes.INVALID_RESPONSE_BODY, "", ""), message: expect.any(String), details: expect.anything()
      };
      await expect(createModelPromise).rejects.toMatchObject(expectedError);
    });

    test("on 201, should reject with an error ERROR_CODE.INVALID_RESPONSE_HEADER if response content-type is not application/json;charset=UTF-8", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the create model REST API will respond with OK and some response
      // that conforms to the modelInfoResponseSchema
      // but the content-type is not application/json;charset=UTF-8
      setupFetchSpy(StatusCodes.CREATED, MockPayload.POST.getPayloadWithOneRandomModelInfo(), "");

      // WHEN the createModel function is called with the given arguments (name, description, ...)
      const service = new ModelInfoService(givenApiServerUrl);
      const createModelPromise = service.createModel(getNewModelSpecMockData());

      // THEN expected it to reject with the error response
      const expectedError = {
        ...new ServiceError(ModelInfoService.name, "createModel", "POST", `${givenApiServerUrl}/models`, StatusCodes.CREATED, ErrorCodes.INVALID_RESPONSE_HEADER, "", ""), details: expect.any(String)
      };
      await expect(createModelPromise).rejects.toMatchObject(expectedError);
    });

    test("on NOT 201, it should reject with an error ERROR_CODE.API_ERROR that contains the body of the response", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the create model REST API will respond with NOT OK and some response body
      const givenResponse = {foo: "foo", bar: "bar"};
      setupFetchSpy(StatusCodes.BAD_REQUEST, givenResponse, "application/json;charset=UTF-8");

      // WHEN the createModel function is called with the given arguments (name, description, ...)
      const service = new ModelInfoService(givenApiServerUrl);

      // THEN expected it to reject with the error response
      const expectedError = {
        ...new ServiceError(ModelInfoService.name, "createModel", "POST", `${givenApiServerUrl}/models`, 0, ErrorCodes.API_ERROR, "", givenResponse), statusCode: expect.any(Number), message: expect.any(String), details: givenResponse
      };
      await expect(service.createModel(getNewModelSpecMockData())).rejects.toMatchObject(expectedError);
    });

  });
});