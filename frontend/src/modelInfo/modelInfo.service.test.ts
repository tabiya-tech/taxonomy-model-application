// mute the console output
import "src/_test_utilities/consoleMock";

import ModelInfoService, { INewModelSpecification, UPDATE_INTERVAL } from "./modelInfo.service";
import { getTestString } from "src/_test_utilities/specialCharacters";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import * as MockPayload from "./_test_utilities/mockModelInfoPayload";
import { StatusCodes } from "http-status-codes";
import { setupFetchSpy } from "src/_test_utilities/fetchSpy";
import { ServiceError } from "src/error/error";
import { ErrorCodes } from "src/error/errorCodes";
import { randomUUID } from "crypto";
import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";

function getNewModelSpecMockData(): INewModelSpecification {
  return {
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    locale: {
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      UUID: randomUUID(),
    },
  };
}

describe("ModelInfoService", () => {
  // GIVEN an api server url
  let givenApiServerUrl: string;
  beforeEach(() => {
    givenApiServerUrl = "/path/to/api";
  });
  afterEach(() => {
    jest.resetAllMocks();
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
      // AND the GET models REST API will respond with OK and some models
      const givenResponseBody: ModelInfoAPISpecs.Types.GET.Response.Payload =
        MockPayload.GET.getPayloadWithArrayOfRandomModelInfo(2);
      const fetchSpy = setupFetchSpy(StatusCodes.OK, givenResponseBody, "application/json;charset=UTF-8");

      // WHEN the getAllModels function is called with the given arguments
      const service = new ModelInfoService(givenApiServerUrl);
      const actualModels = await service.getAllModels();

      // THEN expect it to make a GET request with correct headers and payload
      expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/models`, {
        method: "GET",
        headers: {},
      });

      // AND expect it to return all the model the response contains
      expect(actualModels.length).toEqual(givenResponseBody.length);
      givenResponseBody.forEach((givenModel, index) => {
        expect(actualModels[index]).toEqual({
          ...givenModel,
          createdAt: new Date(givenModel.createdAt),
          updatedAt: new Date(givenModel.updatedAt),
        }); // currently we do not transform the response, so it should be the same
      });
    });

    test("on fail to fetch, getAllModels() should reject with an error ERROR_CODE.FAILED_TO_FETCH", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND fetch rejects with some unknown error
      const givenFetchError = new Error();
      jest.spyOn(window, "fetch").mockRejectedValue(givenFetchError);

      // WHEN calling getAllModels function
      const service = new ModelInfoService(givenApiServerUrl);

      // THEN expected it to reject with the error response
      const expectedError = {
        ...new ServiceError(
          ModelInfoService.name,
          "getAllModels",
          "GET",
          `${givenApiServerUrl}/models`,
          0,
          ErrorCodes.FAILED_TO_FETCH,
          "",
          givenFetchError
        ),
        message: expect.any(String),
      };
      let error;
      try {
        await service.getAllModels();
      } catch (err) {
        error = err;
      }
      expect(error).toBeInstanceOf(ServiceError);
      // AND expect error to be service error
      expect(error).toMatchObject(expectedError);
    });

    test.each([
      ["is a malformed json", "{"],
      ["is a string", "foo"],
      ["is not conforming to ModelResponseSchema", { foo: "foo" }],
    ])(
      "on 200, getAllModels() should reject with an error ERROR_CODE.INVALID_RESPONSE_BODY if response %s",
      async (description, givenResponse) => {
        // GIVEN a api server url
        const givenApiServerUrl = "/path/to/api";
        // AND the GET models REST API will respond with OK and some response that does conform to the modelInfoResponseSchema even if it states that it is application/json
        setupFetchSpy(StatusCodes.OK, givenResponse, "application/json;charset=UTF-8");

        // WHEN the getAllModels function is called
        const service = new ModelInfoService(givenApiServerUrl);
        // THEN expect it to reject with the error response
        const expectedError = {
          ...new ServiceError(
            ModelInfoService.name,
            "getAllModels",
            "GET",
            `${givenApiServerUrl}/models`,
            StatusCodes.OK,
            ErrorCodes.INVALID_RESPONSE_BODY,
            "",
            ""
          ),
          message: expect.any(String),
          details: expect.anything(),
        };
        let error;
        try {
          await service.getAllModels();
        } catch (err) {
          error = err;
        }
        expect(error).toMatchObject(expectedError);
        // AND expect error to be service error
        expect(error).toBeInstanceOf(ServiceError);
      }
    );

    test("on 200, getAllModels() should reject with an error ERROR_CODE.INVALID_RESPONSE_HEADER if response content-type is not application/json;charset=UTF-8", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the GET models REST API will respond with OK and some response that
      // that conforms to the modelInfoResponseSchemaGET
      // but the content-type is not application/json;charset=UTF-8
      setupFetchSpy(StatusCodes.OK, MockPayload.GET.getPayloadWithArrayOfRandomModelInfo(1), "");

      // WHEN the getAllModels function is called
      const service = new ModelInfoService(givenApiServerUrl);

      // THEN expect it to reject with the error response
      const expectedError = {
        ...new ServiceError(
          ModelInfoService.name,
          "getAllModels",
          "GET",
          `${givenApiServerUrl}/models`,
          StatusCodes.OK,
          ErrorCodes.INVALID_RESPONSE_HEADER,
          "",
          ""
        ),
        message: expect.any(String),
        details: expect.anything(),
      };
      let error;
      try {
        await service.getAllModels();
      } catch (err) {
        error = err;
      }
      expect(error).toMatchObject(expectedError);
      // AND expect error to be service error
      expect(error).toBeInstanceOf(ServiceError);
    });

    test("on NOT 200, getAllModels() should reject with an error ERROR_CODE.API_ERROR that contains the body of the response", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the create model REST API will respond with NOT OK and some response body
      const givenResponse = { foo: "foo", bar: "bar" };
      setupFetchSpy(StatusCodes.BAD_REQUEST, givenResponse, "application/json;charset=UTF-8");

      // WHEN the getAllModels function is called
      const service = new ModelInfoService(givenApiServerUrl);
      // THEN expect it to reject with the error response
      const expectedError = {
        ...new ServiceError(
          ModelInfoService.name,
          "getAllModels",
          "GET",
          `${givenApiServerUrl}/models`,
          0,
          ErrorCodes.API_ERROR,
          "",
          givenResponse
        ),
        statusCode: expect.any(Number),
        message: expect.any(String),
        details: givenResponse,
      };
      let error;
      try {
        await service.getAllModels();
      } catch (err) {
        error = err;
      }
      expect(error).toMatchObject(expectedError);
      // AND expect error to be service error
      expect(error).toBeInstanceOf(ServiceError);
    });
  });

  describe("fetchAllModelsPeriodically", () => {
    const modelInfoService = new ModelInfoService(givenApiServerUrl);

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("fetchAllModelsPeriodically() should fetch models immediately the first time and periodically after that", async () => {
      // GIVEN that the getAllModels function will succeed and return some models
      const givenMockModels = [{ foo: "foo" }, { bar: "bar" }]; // we do not ready care about the content of the models
      jest.spyOn(modelInfoService, "getAllModels").mockResolvedValue(givenMockModels as any);

      // AND a success callback function
      const givenOnSuccessCallback = jest.fn();
      // AND an error callback function
      const givenOnErrorCallback = jest.fn();

      // WHEN the fetchAllModelsPeriodically function is called with the given callbacks
      const actualTimer = modelInfoService.fetchAllModelsPeriodically(givenOnSuccessCallback, givenOnErrorCallback);

      // THEN expect to have called the getAllModels function once
      expect(modelInfoService.getAllModels).toHaveBeenCalledTimes(1);

      // AND WHEN all pending promises have been resolved
      await Promise.resolve(); // Resolve the promise queue
      await Promise.resolve(); // Resolve the promise queue once more to to call the finally()
      // AND N times the interval has elapsed
      const N = 3;
      for (let i = 1; i <= N; i++) {
        jest.advanceTimersByTime(UPDATE_INTERVAL);

        // AND all pending promises have been resolved
        await Promise.resolve(); // Resolve the promise queue
        await Promise.resolve(); // Resolve the promise queue once more to to call the finally()

        // THEN expect getAllModels function to be called N + 1 times
        expect(modelInfoService.getAllModels).toHaveBeenCalledTimes(i + 1);
        // AND expect onSuccessCallback function to be called N + 1 times with the given models
        expect(givenOnSuccessCallback).toHaveBeenCalledTimes(i + 1);
        expect(givenOnSuccessCallback).toHaveBeenNthCalledWith(i, givenMockModels);
      }
      // AND WHEN the timer is cleared
      clearInterval(actualTimer);
      // AND the time is advanced by the polling interval
      jest.advanceTimersByTime(UPDATE_INTERVAL);
      // AND all pending promises have been resolved
      await Promise.resolve(); // Resolve the promise queue
      await Promise.resolve(); // Resolve the promise queue once more to to call the finally()

      // THEN expect getAllModels function has not been called an additional time
      expect(modelInfoService.getAllModels).toHaveBeenCalledTimes(N + 1);
      // THEN expect onSuccessCallback function has not been called an additional time with the given models
      expect(givenOnSuccessCallback).toHaveBeenCalledTimes(N + 1);

      // AND onErrorCallbackMock function to not be called
      expect(givenOnErrorCallback).not.toHaveBeenCalled();
    });

    test("fetchAllModelsPeriodically() should call onErrorCallback whenever an error occurs otherwise call onSuccessCallback", async () => {
      // GIVEN that the getAllModels function will fail the first time is called
      const givenErrorOne = new Error("An error occurred 1");
      jest.spyOn(modelInfoService, "getAllModels").mockRejectedValueOnce(givenErrorOne);
      // AND then succeed and return some models the second it is called
      // GIVEN that the getAllModels function will succeed and return some models
      const givenMockModels = [{ foo: "foo" }, { bar: "bar" }]; // we do not ready care about the content of the models
      jest.spyOn(modelInfoService, "getAllModels").mockResolvedValueOnce(givenMockModels as any);
      // AND then fail again with the another error the third time is called
      const givenErrorTwo = new Error("An error occurred 2");
      jest.spyOn(modelInfoService, "getAllModels").mockRejectedValueOnce(givenErrorTwo);
      // AND a success callback function
      const givenOnSuccessCallback = jest.fn();
      // AND an error callback function
      const givenOnErrorCallback = jest.fn();

      // WHEN the fetchAllModelsPeriodically function is called with the given callbacks
      modelInfoService.fetchAllModelsPeriodically(givenOnSuccessCallback, givenOnErrorCallback);

      // AND all pending promises have been resolved
      await Promise.resolve(); // Resolve the promise queue
      await Promise.resolve(); // Resolve the promise queue once more to to call the finally()

      // THEN expect givenOnErrorCallback function to be called with the first error
      expect(givenOnErrorCallback).toHaveBeenNthCalledWith(1, givenErrorOne);

      // AND WHEN the timer is advanced by polling internal, so that we can expect the getModel to be called 3 times
      jest.advanceTimersByTime(UPDATE_INTERVAL);
      // AND all pending promises have been resolved
      await Promise.resolve(); // Resolve the promise queue
      await Promise.resolve(); // Resolve the promise queue once more to to call the finally()

      // THEN expect the onErrorCallback function to be called
      expect(givenOnSuccessCallback).toHaveBeenNthCalledWith(1, givenMockModels);

      // AND WHEN the timer is advanced by polling internal, so that we can expect the getModel to be called 3 times
      jest.advanceTimersByTime(UPDATE_INTERVAL);
      // AND all pending promises have been resolved
      await Promise.resolve(); // Resolve the promise queue
      await Promise.resolve(); // Resolve the promise queue once more to to call the finally()

      // THEN expect givenOnErrorCallback function to be called with the second error
      expect(givenOnErrorCallback).toHaveBeenNthCalledWith(2, givenErrorTwo);
    });

    test("fetchAllModelsPeriodically() should skip calling getModels() if it is already fetching", async () => {
      // GIVEN that the getAllModels function will succeed and return some models only after 2 polling intervals
      const givenMockModelsFirstCall = [{ foo: "foo" }]; // we do not ready care about the content of the models
      jest.spyOn(modelInfoService, "getAllModels").mockImplementationOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(givenMockModelsFirstCall as any);
          }, UPDATE_INTERVAL * 2);
        });
      });

      // AND then succeed and return some models the second and third call it is called
      const givenMockModelsAfterFirstCall = [{ bar: "bar" }]; // we do not ready care about the content of the models
      jest.spyOn(modelInfoService, "getAllModels").mockResolvedValue(givenMockModelsAfterFirstCall as any);

      // AND a success callback function
      const givenOnSuccessCallback = jest.fn();
      // AND an error callback function
      const givenOnErrorCallback = jest.fn();

      // WHEN the fetchAllModelsPeriodically function is called with the given callbacks
      modelInfoService.fetchAllModelsPeriodically(givenOnSuccessCallback, givenOnErrorCallback);
      // AND the time is advanced by the polling interval
      jest.advanceTimersByTime(UPDATE_INTERVAL);
      // AND all pending promises have been resolved
      await Promise.resolve(); // Resolve the promise queue
      await Promise.resolve(); // Resolve the promise queue once more to to call the finally()

      // THEN expect getAllModels function to be called once
      expect(modelInfoService.getAllModels).toHaveBeenCalledTimes(1);
      // AND expect onSuccessCallback function to be called 0 times
      expect(givenOnSuccessCallback).toHaveBeenCalledTimes(0);

      // AND when the time is advanced by the polling interval again
      jest.advanceTimersByTime(UPDATE_INTERVAL);
      // AND all pending promises have been resolved
      await Promise.resolve(); // Resolve the promise queue
      await Promise.resolve(); // Resolve the promise queue once more to to call the finally()
      // THEN expect getAllModels function to still have been called once
      expect(modelInfoService.getAllModels).toHaveBeenCalledTimes(1);
      // AND expect onSuccessCallback function to be called 1 times with the given models
      expect(givenOnSuccessCallback).toHaveBeenCalledTimes(1);
      expect(givenOnSuccessCallback).toHaveBeenNthCalledWith(1, givenMockModelsFirstCall);

      // AND when the time is advanced by the polling interval thereafter N times
      const N = 3;
      for (let i = 1; i <= N; i++) {
        // AND when the time is advanced by the polling interval again
        jest.advanceTimersByTime(UPDATE_INTERVAL);
        // AND all pending promises have been resolved
        await Promise.resolve(); // Resolve the promise queue
        await Promise.resolve(); // Resolve the promise queue once more to to call the finally()
        // THEN expect getAllModels function to have been called two times
        expect(modelInfoService.getAllModels).toHaveBeenCalledTimes(i + 1);
        // AND expect onSuccessCallback function to be called 2 times with the given models
        expect(givenOnSuccessCallback).toHaveBeenCalledTimes(i + 1);
        expect(givenOnSuccessCallback).toHaveBeenNthCalledWith(i + 1, givenMockModelsAfterFirstCall);
      }

      // AND onErrorCallbackMock function to not be called
      expect(givenOnErrorCallback).not.toHaveBeenCalled();
    });
  });

  describe("createModel", () => {
    const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
    addFormats(ajv);
    ajv.addSchema(LocaleAPISpecs.Schemas.Payload);
    ajv.addSchema(ModelInfoAPISpecs.Schemas.POST.Request.Payload);
    ajv.addSchema(ModelInfoAPISpecs.Schemas.POST.Response.Payload);
    const validateResponse = ajv.compile(ModelInfoAPISpecs.Schemas.POST.Response.Payload);

    test("should call the REST createModel API at the correct URL, with POST and the correct headers and payload successfully", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND a name, description, locale
      const givenModelSpec = getNewModelSpecMockData();
      // AND the create model REST API will respond with OK and some newly create model
      const givenResponseBody: ModelInfoAPISpecs.Types.POST.Response.Payload =
        MockPayload.POST.getPayloadWithOneRandomModelInfo();
      const fetchSpy = setupFetchSpy(StatusCodes.CREATED, givenResponseBody, "application/json;charset=UTF-8");

      // WHEN the createModel function is called with the given arguments (name, description, ...)
      const service = new ModelInfoService(givenApiServerUrl);

      const actualCreatedModel = await service.createModel(givenModelSpec);
      // THEN expect it to make a POST request
      // AND the headers
      // AND the request payload to contain the given arguments (name, description, ...)
      expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(givenModelSpec),
      });

      const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);

      // AND the body conforms to the modelRequestSchema
      const validateRequest = ajv.compile(ModelInfoAPISpecs.Schemas.POST.Request.Payload);
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
      jest.spyOn(window, "fetch").mockRejectedValue(givenFetchError);

      // WHEN calling create model function
      const service = new ModelInfoService("/path/to/foo");

      // THEN expected it to reject with the error response
      const expectedError = {
        ...new ServiceError(
          ModelInfoService.name,
          "createModel",
          "POST",
          "/path/to/foo/models",
          0,
          ErrorCodes.FAILED_TO_FETCH,
          "",
          ""
        ),
        details: expect.any(Error),
      };
      await expect(service.createModel(getNewModelSpecMockData())).rejects.toMatchObject(expectedError);
    });

    test.each([
      ["is a malformed json", "{"],
      ["is a string", "foo"],
      ["is not conforming to ModelResponseSchema", { foo: "foo" }],
    ])(
      "on 201, should reject with an error ERROR_CODE.INVALID_RESPONSE_BODY if response %s",
      async (description, givenResponse) => {
        // GIVEN a api server url
        const givenApiServerUrl = "/path/to/api";
        // AND the create model REST API will respond with OK and some response that does conform to the modelInfoResponseSchema even if it states that it is application/json
        setupFetchSpy(StatusCodes.CREATED, givenResponse, "application/json;charset=UTF-8");

        // WHEN the createModel function is called with the given arguments (name, description, ...)
        const service = new ModelInfoService(givenApiServerUrl);
        const createModelPromise = service.createModel(getNewModelSpecMockData());

        // THEN expected it to reject with the error response
        const expectedError = {
          ...new ServiceError(
            ModelInfoService.name,
            "createModel",
            "POST",
            `${givenApiServerUrl}/models`,
            StatusCodes.CREATED,
            ErrorCodes.INVALID_RESPONSE_BODY,
            "",
            ""
          ),
          message: expect.any(String),
          details: expect.anything(),
        };
        await expect(createModelPromise).rejects.toMatchObject(expectedError);
      }
    );

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
        ...new ServiceError(
          ModelInfoService.name,
          "createModel",
          "POST",
          `${givenApiServerUrl}/models`,
          StatusCodes.CREATED,
          ErrorCodes.INVALID_RESPONSE_HEADER,
          "",
          ""
        ),
        details: expect.any(String),
      };
      await expect(createModelPromise).rejects.toMatchObject(expectedError);
    });

    test("on NOT 201, it should reject with an error ERROR_CODE.API_ERROR that contains the body of the response", async () => {
      // GIVEN a api server url
      const givenApiServerUrl = "/path/to/api";
      // AND the create model REST API will respond with NOT OK and some response body
      const givenResponse = { foo: "foo", bar: "bar" };
      setupFetchSpy(StatusCodes.BAD_REQUEST, givenResponse, "application/json;charset=UTF-8");

      // WHEN the createModel function is called with the given arguments (name, description, ...)
      const service = new ModelInfoService(givenApiServerUrl);

      // THEN expected it to reject with the error response
      const expectedError = {
        ...new ServiceError(
          ModelInfoService.name,
          "createModel",
          "POST",
          `${givenApiServerUrl}/models`,
          0,
          ErrorCodes.API_ERROR,
          "",
          givenResponse
        ),
        statusCode: expect.any(Number),
        message: expect.any(String),
        details: givenResponse,
      };
      await expect(service.createModel(getNewModelSpecMockData())).rejects.toMatchObject(expectedError);
    });
  });
});
