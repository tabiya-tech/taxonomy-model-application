import ModelInfoService from "./modelInfo.service";
import {getTestString} from "src/_test_utilities/specialCharacters";
import {ModelInfo} from "api-specifications/modelInfo"
import {getMockModelInfoPayload} from "./_test_utilities/mockModelInfoPayload";
import {StatusCodes} from "http-status-codes";
import {setupFetchSpy} from "src/_test_utilities/fetchSpy";
import {ServiceError} from "src/error/error";
import {ErrorCodes} from "src/error/errorCodes";

describe("ModelInfoService", () => {

  test("should construct the service successfully", () => {
    // GIVEN an api server url
    const givenApiServerUrl = getTestString(10);

    // WHEN the service is constructed
    const service = new ModelInfoService(givenApiServerUrl);

    // THEN expect the service to be constructed successfully
    expect(service).toBeDefined();

    // AND the service should have the correct endpoint url
    expect(service.modelInfoEndpointUrl).toEqual(`${givenApiServerUrl}/models`);
  });

  test("getAllModels() should call the REST API at the correct URL, with GET and the correct headers and payload successfully", async () => {
    // GIVEN an api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the GET models REST API will respond with OK and some models
    const givenResponse: ModelInfo.GET.Response.Payload = getMockModelInfoPayload(2);
    const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponse, "application/json;charset=UTF-8");

    // WHEN the getAllModels function is called with the given arguments
    const service = new ModelInfoService(givenApiServerUrl);
    const actualModels = await service.getAllModels();

    // THEN expect it to make a GET request with correct headers and payload
    expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/models`, {
      method: "GET",
      headers: {}
    });

    // AND expect it to return all the model the response contains
    expect(actualModels.length).toEqual(givenResponse.length);
    givenResponse.forEach((givenModel, index) => {
      expect(actualModels[index]).toEqual({
        ...givenModel,
        createdAt: new Date(givenModel.createdAt),
        updatedAt: new Date(givenModel.updatedAt)
      }); // currently we do not transform the response, so it should be the same
    });
  });
  test("on fail to fetch, it should reject with an error ERROR_CODE.FAILED_TO_FETCH", async () => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND fetch rejects with some unknown error
    const givenFetchError = new Error();
    jest.spyOn(window, 'fetch').mockRejectedValue(givenFetchError);

    // WHEN calling getAllModels function
    const service = new ModelInfoService(givenApiServerUrl);

    // THEN expected it to reject with the error response
    const expectedError = {
      ...new ServiceError(ModelInfoService.name, "getAllModels", "GET", `${givenApiServerUrl}/models`, 0, ErrorCodes.FAILED_TO_FETCH, "", ""),
      message: expect.any(String),
      details: expect.any(Error)
    };
    await expect(service.getAllModels()).rejects.toMatchObject(expectedError);
  });

  test.each([
    ["is a malformed json", '{'],
    ["is a string", 'foo'],
    ["is not conforming to ModelResponseSchema", {foo: "foo"}],
  ])
  ("on 200, should reject with an error ERROR_CODE.INVALID_RESPONSE_BODY if response %s", async (description, givenResponse) => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the GET models REST API will respond with OK and some response that does conform to the modelInfoResponseSchema even if it states that it is application/json
    setupFetchSpy(StatusCodes.OK, givenResponse, "application/json;charset=UTF-8");

    // WHEN the getAllModels function is called
    const service = new ModelInfoService(givenApiServerUrl);
    const getAllModelsPromise = service.getAllModels();

    // THEN expect it to reject with the error response
    const expectedError = {
      ...new ServiceError(ModelInfoService.name, "getAllModels", "GET", `${givenApiServerUrl}/models`, StatusCodes.OK, ErrorCodes.INVALID_RESPONSE_BODY, "", ""),
      message: expect.any(String),
      details: expect.anything()
    };
    await expect(getAllModelsPromise).rejects.toMatchObject(expectedError);
  });


  test("on 200, should reject with an error ERROR_CODE.INVALID_RESPONSE_HEADER if response content-type is not application/json;charset=UTF-8", async () => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND the GET models REST API will respond with OK and some response that
    // that conforms to the modelInfoResponseSchemaGET
    // but the content-type is not application/json;charset=UTF-8
    setupFetchSpy(StatusCodes.OK, getMockModelInfoPayload(1), "");

    // WHEN the getAllModels function is called
    const service = new ModelInfoService(givenApiServerUrl);
    const getAllModelsPromise = service.getAllModels();

    // THEN expect it to reject with the error response
    const expectedError = {
      ...new ServiceError(ModelInfoService.name, "getAllModels", "GET", `${givenApiServerUrl}/models`, StatusCodes.OK, ErrorCodes.INVALID_RESPONSE_HEADER, "", ""),
      message: expect.any(String),
      details: expect.anything()
    };
    await expect(getAllModelsPromise).rejects.toMatchObject(expectedError);
  });

  test("on NOT 200, it should reject with an error ERROR_CODE.API_ERROR that contains the body of the response", async () => {
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
      ...new ServiceError(ModelInfoService.name, "getAllModels", "GET", `${givenApiServerUrl}/models`, 0, ErrorCodes.API_ERROR, "", givenResponse),
      statusCode: expect.any(Number),
      message: expect.any(String),
      details: givenResponse
    };
    await expect(getAllModelsPromise).rejects.toMatchObject(expectedError);
  });
})


