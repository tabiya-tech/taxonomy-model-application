import * as config from "server/config/config";
import * as transformModule from "./transform";
import { handler as modelHandler } from "./index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";

import { randomUUID } from "crypto";
import ErrorAPISpecs from "api-specifications/error";
import { getRandomString } from "_test_utilities/specialCharacters";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { getIModelInfoMockData } from "./testDataHelper";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import {
  testMethodsNotAllowed,
  testRequestJSONMalformed,
  testRequestJSONSchema,
  testTooLargePayload,
  testUnsupportedMediaType,
} from "_test_utilities/stdRESTHandlerTests";
import { IModelInfo, IModelInfoReference } from "./modelInfo.types";

const transformSpy = jest.spyOn(transformModule, "transform");

describe("Test for model handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    test("POST should respond with the CREATED status code and the newly created modelInfo for a valid and a max size payload", async () => {
      // GIVEN a valid request (method & header & payload)
      const givenPayload: ModelInfoAPISpecs.Types.POST.Request.Payload = {
        name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
        locale: {
          UUID: randomUUID(),
          name: getRandomString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
          shortCode: getRandomString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
        },
        description: getRandomString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        UUIDHistory: [randomUUID()],
      };
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
      } as never;

      // AND a configured base path for resources
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl);

      // AND a repository that will successfully create a model
      const givenModelInfo: IModelInfo = getIModelInfoMockData();
      // AND a repository that will get the UUIDHistory for  the given model
      const givenUuidHistoryDetails: IModelInfoReference[] = [
        {
          id: "someStringID",
          UUID: "someUUID",
          name: "foo",
          version: "",
          localeShortCode: "NA",
        },
      ];
      const givenModelInfoRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(givenModelInfo),
        getModelById: jest.fn().mockResolvedValue(null),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue([]),
        getHistory: jest.fn().mockResolvedValue(givenUuidHistoryDetails),
      };
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await modelHandler(givenEvent);

      // THEN expect the handler to call the repository with the given payload
      expect(getRepositoryRegistry().modelInfo.create).toHaveBeenCalledWith(givenPayload);
      // AND expect the handler to call the getUUIDHistory method for the given model
      expect(getRepositoryRegistry().modelInfo.getHistory).toHaveBeenCalledWith(givenPayload.UUIDHistory);
      // AND respond with the CREATED status
      expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the transformation function is called correctly
      expect(transformModule.transform).toHaveBeenCalledWith(
        givenModelInfo,
        givenResourcesBaseUrl,
        givenUuidHistoryDetails
      );
      // AND the handler to return the expected result
      expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
    });

    test("POST should respond with the INTERNAL_SERVER_ERROR status code if the repository fails to create the model info", async () => {
      // GIVEN a valid request event (method & header & payload)
      const givenPayload = {
        name: "foo",
        locale: {
          UUID: randomUUID(),
          name: "ZA",
          shortCode: "SA",
        },
        description: "some text",
        UUIDHistory: [randomUUID()],
      };
      const givenEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json",
        },
      } as never;

      // AND the repository fails to create a model
      const givenModelInfoRepositoryMock = {
        Model: undefined,
        create: jest.fn().mockRejectedValue(new Error("foo")),
        getModelById: jest.fn().mockResolvedValue(null),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue([]),
        getHistory: jest.fn().mockResolvedValue([]),
      } as never;

      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await modelHandler(givenEvent);

      // THEN expect the handler to call the repository with the given payload
      expect(getRepositoryRegistry().modelInfo.create).toHaveBeenCalledWith(givenPayload);
      // AND to respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: ModelInfoAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_MODEL,
        message: "Failed to create the model in the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    testUnsupportedMediaType(modelHandler);

    testRequestJSONSchema(modelHandler);

    testRequestJSONMalformed(modelHandler);

    testTooLargePayload(HTTP_VERBS.POST, ModelInfoAPISpecs.Constants.MAX_PAYLOAD_LENGTH, modelHandler);
  });

  describe("GET", () => {
    // GIVEN a valid GET request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
    } as never;

    // AND a configured base path for resources
    const givenResourcesBaseUrl = "https://some/path/to/api/resources";
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);

    test("GET should respond with the OK status code and all the models in the body", async () => {
      // AND GIVEN a repository that will successfully get an arbitrary number (N) of models
      const givenModels: Array<IModelInfo> = [
        // the first model has a UUIDHistory with its own UUID
        {
          ...getIModelInfoMockData(1),
          UUID: "foo",
          UUIDHistory: ["foo"],
        },
        // the second model has a UUIDHistory with its own UUID and the UUID of the first model
        {
          ...getIModelInfoMockData(2),
          UUID: "bar",
          UUIDHistory: ["bar", "foo"],
        },
        // the third model has a UUIDHistory with its own UUID and a UUID that does not exist in the models array
        {
          ...getIModelInfoMockData(3),
          UUID: "baz",
          UUIDHistory: ["baz", randomUUID()],
        },
      ];
      // AND a repository that will successfully get the N models
      const givenModelInfoRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue(null),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue(givenModels),
        getHistory: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await modelHandler(givenEvent);

      // THEN expect the handler to call the repository getModels() method
      expect(getRepositoryRegistry().modelInfo.getModels).toHaveBeenCalled();
      // AND respond with the OK status
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND the handler to return the correct headers
      expect(actualResponse.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      // AND the transformation function is called correctly for each of the N models
      const transformSpy = jest.spyOn(transformModule, "transform");

      // THEN expect the transform function to have been called for each model in the array
      expect(transformSpy).toHaveBeenCalledTimes(givenModels.length);
      //AND the transform function to have been called with the correct parameters
      givenModels.forEach((model) => {
        // find the models in the UUIDHistory that could be resolved
        const expectdUUIDHistoryDetails: IModelInfoReference[] = givenModels
          .filter((m) => model.UUIDHistory.includes(m.UUID))
          .map((modelInfo) => ({
            UUID: modelInfo.UUID,
            id: modelInfo.id,
            name: modelInfo.name,
            version: modelInfo.version,
            localeShortCode: modelInfo.locale.shortCode,
          }));
        // add the UUIDs that were not able to be resolved
        model.UUIDHistory.forEach((uuid) => {
          if (expectdUUIDHistoryDetails.find((m) => m.UUID === uuid) === undefined) {
            expectdUUIDHistoryDetails.push({
              UUID: uuid,
              id: null,
              name: null,
              version: null,
              localeShortCode: null,
            });
          }
        });
        expect(transformSpy).toHaveBeenCalledWith(
          model,
          givenResourcesBaseUrl,
          expect.arrayContaining(expectdUUIDHistoryDetails)
        );
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
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue(null),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockRejectedValue(new Error("foo")),
        getHistory: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await modelHandler(givenEvent);
      // THEN expect the handler to call the repository getModels() method
      expect(getRepositoryRegistry().modelInfo.getModels).toHaveBeenCalled();
      // AND to respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: ModelInfoAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_MODELS,
        message: "Failed to retrieve models from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    test("GET should respond with INTERNAL_SERVER_ERROR status code if the repository fails to get the uuid histrory for the models", async () => {
      // AND GIVEN the repository fails to get the models
      const givenModelInfoRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue(null),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue(null),
        getHistory: jest.fn().mockRejectedValue(new Error("foo")),
      };
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the info handler is invoked with the given event
      const actualResponse = await modelHandler(givenEvent);
      // THEN expect the handler to call the repository getModels() method
      expect(getRepositoryRegistry().modelInfo.getModels).toHaveBeenCalled();
      // AND to respond with the INTERNAL_SERVER_ERROR status
      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      // AND the response body contains the error information
      const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
        errorCode: ModelInfoAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_MODELS,
        message: "Failed to retrieve models from the DB",
        details: "",
      };
      expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    });

    testMethodsNotAllowed([HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH], modelHandler);
  });
});
