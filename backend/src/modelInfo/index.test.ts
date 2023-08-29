import * as config from "server/config/config";
import * as transformModule from "./transform";
import {handler as modelHandler} from "./index";
import {HTTP_VERBS, StatusCodes} from "server/httpUtils";

import {IModelInfo} from "./modelInfoModel";
import {randomUUID} from "crypto";
import * as APIError from "api-specifications/error";
import {getRandomString} from "_test_utilities/specialCharacters";
import {
} from "api-specifications/modelInfo";
import * as ModelInfo from "api-specifications/modelInfo";
import {getIModelInfoMockData, getModelInfoMockDataArray} from "./testDataHelper";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  testMethodsNotAllowed, testRequestJSONMalformed, testRequestJSONSchema, testTooLargePayload, testUnsupportedMediaType
} from "_test_utilities/stdRESTHandlerTests";
import {IModelRepository} from "./ModelInfoRepository";

const transformSpy = jest.spyOn(transformModule, "transform");


describe("Test for model handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {

    test("POST should respond with the CREATED status code and the newly created modelInfo for a valid and a max size payload", async () => {

      // GIVEN a valid request (method & header & payload)
      const givenPayload: ModelInfo.Types.POST.Request.Payload = {
        name: getRandomString(ModelInfo.Constants.NAME_MAX_LENGTH), locale: {
          UUID: randomUUID(),
          name: getRandomString(ModelInfo.Constants.NAME_MAX_LENGTH),
          shortCode: getRandomString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
        }, description: getRandomString(ModelInfo.Constants.DESCRIPTION_MAX_LENGTH)
      }
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST, body: JSON.stringify(givenPayload), headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        }
      } as any;

      // AND a configured base path for resources
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl)

      // AND a repository that will successfully create a model
      const givenModelInfo: IModelInfo = getIModelInfoMockData();
      const givenModelInfoRepositoryMock = {
        Model: undefined as any,
        create: jest.fn().mockResolvedValue(givenModelInfo),
        getModelById: jest.fn().mockResolvedValue(null),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue([])
      };
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await modelHandler(givenEvent);

      // THEN expect the handler to call the repository with the given payload
      expect(getRepositoryRegistry().modelInfo.create).toHaveBeenCalledWith(givenPayload);
      // AND respond with the CREATED status
      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({"Content-Type": "application/json"});
      // AND the transformation function is called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(givenModelInfo, givenResourcesBaseUrl);
      // AND the handler to return the result of the transformation function
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
    });

    test('POST should respond with the INTERNAL_SERVER_ERROR status code if the repository fails to create the model info', async () => {

      // GIVEN a valid request event (method & header & payload)
      const givenPayload = {
        name: 'foo', locale: {
          UUID: randomUUID(), name: 'ZA', shortCode: 'SA'
        }, description: 'some text',
      }
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST, body: JSON.stringify(givenPayload), headers: {
          'Content-Type': 'application/json'
        }
      } as any;

      // AND the repository fails to create a model
      const givenModelInfoRepositoryMock = {
        Model: undefined,
        create: jest.fn().mockRejectedValue(new Error("foo")),
        getModelById: jest.fn().mockResolvedValue(null),
        getModelByUUID: jest.fn().mockResolvedValue(null)
      } as any;

      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await modelHandler(givenEvent);

      // THEN expect the handler to call the repository with the given payload
      expect(getRepositoryRegistry().modelInfo.create).toHaveBeenCalledWith(givenPayload);
      // AND to respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: APIError.Types.IErrorResponse = {
        "errorCode": ModelInfo.Types.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_MODEL,
        "message": "Failed to create the model in the DB",
        "details": "",
      }
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    testUnsupportedMediaType(modelHandler);

    testRequestJSONSchema(modelHandler);

    testRequestJSONMalformed(modelHandler);

    testTooLargePayload(HTTP_VERBS.POST, ModelInfo.Constants.MAX_PAYLOAD_LENGTH, modelHandler)
  });

  describe("GET", () => {

    // GIVEN a valid GET request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET, headers: {}
    } as any;

    // AND a configured base path for resources
    const givenResourcesBaseUrl = "https://some/path/to/api/resources";
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl)

    test("GET should respond with the OK status code and all the models in the body", async () => {

      // AND GIVEN a repository that will successfully get an arbitrary number (N) of models
      const givenModels: Array<IModelInfo> = getModelInfoMockDataArray(5)
      const givenModelInfoRepositoryMock = {
        Model: undefined as any,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue(null),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue(givenModels)
      };
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await modelHandler(givenEvent)

      // THEN expect the handler to call the repository getModels() method
      expect(getRepositoryRegistry().modelInfo.getModels).toHaveBeenCalled();
      // AND respond with the OK status
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({"Content-Type": "application/json"});
      // AND the transformation function is called correctly for each of the N models
      const transformSpy = jest.spyOn(transformModule, 'transform');

      // THEN expect the transform function to have been called for each model in the array
      expect(transformSpy).toHaveBeenCalledTimes(givenModels.length);
      //AND the transform function to have been called with the correct parameters
      givenModels.forEach((model, index) => {
        expect(transformSpy).toHaveBeenNthCalledWith(index + 1, model, givenResourcesBaseUrl);
      });

      // AND the handler to have returned the results of the transformation function
      const parsedBody = JSON.parse(actualResponse.body);
      expect(parsedBody.length).toBe(transformSpy.mock.results.length);
      parsedBody.forEach((model: IModelInfo, index: number) => {
        expect(model).toMatchObject(transformSpy.mock.results[index].value);
      });
    });

    test("GET should respond with the INTERNAL_SERVER_ERROR status code if the repository fails to get the models", async () => {
      // AND GIVEN the repository fails to get the models
      const givenModelInfoRepositoryMock = {
        Model: undefined as any,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue(null),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue(new Error("foo"))
      };
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await modelHandler(givenEvent)
      // THEN expect the handler to call the repository getModels() method
      expect(getRepositoryRegistry().modelInfo.getModels).toHaveBeenCalled()
      // AND to respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: APIError.Types.IErrorResponse = {
        "errorCode": ModelInfo.Types.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_MODELS,
        "message": "Failed to retrieve models from the DB",
        "details": "",
      }
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    testMethodsNotAllowed([HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH], modelHandler);
  })
});