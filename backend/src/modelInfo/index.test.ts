import * as config from "server/config/config";
import * as transformModule from "./transform";
import {handler as modelHandler} from "./index";
import {HTTP_VERBS, StatusCodes} from "server/httpUtils";

import {IModelInfo} from "./modelInfoModel";
import {randomUUID} from "crypto";
import {IErrorResponse} from "api-specifications/error";
import {getRandomString} from "_test_utilities/specialCharacters";
import {
  DESCRIPTION_MAX_LENGTH,
  IModelInfoRequest,
  LOCALE_SHORTCODE_MAX_LENGTH,
  ModelInfoResponseErrorCodes,
  NAME_MAX_LENGTH
} from "api-specifications/modelInfo";
import {getIModelInfoMockData} from "./testDataHelper";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  testMethodsNotAllowed, testRequestJSONMalformed,
  testRequestJSONSchema,
  testUnsupportedMediaType
} from "_test_utilities/stdRESTHandlerTests";

const transformSpy = jest.spyOn(transformModule, "transform");


describe("Test for model handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST should respond with the CREATED status code and the newly created modelInfo", async () => {
    // GIVEN a valid request (method & header & payload)
    const givenPayload: IModelInfoRequest = {
      name: getRandomString(NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getRandomString(NAME_MAX_LENGTH),
        shortCode: getRandomString(LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getRandomString(DESCRIPTION_MAX_LENGTH)
    }
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    }
    // AND a configured base path for resources
    const givenResourcesBaseUrl = "https://some/path/to/api/resources";
    jest.spyOn(config, "getResourcesBaseUrl").mockReturnValueOnce(givenResourcesBaseUrl)
    // AND a repository that will successfully create a model
    const givenModelInfo: IModelInfo = getIModelInfoMockData();
    const givenModelInfoRepositoryMock = {
      Model: undefined as any,
      create: jest.fn().mockResolvedValue(givenModelInfo),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null)
    };
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the info handler is invoked with the given event
    // @ts-ignore
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
      name: 'foo',
      locale: {
        UUID: randomUUID(),
        name: 'ZA',
        shortCode: 'SA'
      },
      description: 'some text',
    }
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    // AND the repository fails to create a model
    const givenModelInfoRepositoryMock = {
      Model: undefined,
      create: jest.fn().mockRejectedValue(new Error("foo")),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null)
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the info handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to call the repository with the given payload
    expect(getRepositoryRegistry().modelInfo.create).toHaveBeenCalledWith(givenPayload);
    // AND to respond with the INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    // AND the response body contains the error information
    const expectedErrorBody: IErrorResponse = {
      "errorCode": ModelInfoResponseErrorCodes.DB_FAILED_TO_CREATE_MODEL,
      "message": "Failed to create the model in the DB",
      "details": "",
    }
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });
  
  testMethodsNotAllowed([
    HTTP_VERBS.PUT,
    HTTP_VERBS.DELETE,
    HTTP_VERBS.OPTIONS,
    HTTP_VERBS.PATCH,
    HTTP_VERBS.GET
  ], modelHandler);
  
  testUnsupportedMediaType(modelHandler);
  
  testRequestJSONSchema(modelHandler);
  
  testRequestJSONMalformed(modelHandler);
})