import * as config from "server/config/config";
import * as transformModule from "./transform";
import {handler as modelHandler} from "./index";
import {HTTP_VERBS, StatusCodes, STD_ERRORS_RESPONSES} from "server/httpUtils";

import {IModelInfo} from "./modelInfoModel";
import {randomUUID} from "crypto";
import {ErrorCodes, IErrorResponse} from "api-specifications/error";
import {getRandomString} from "_test_utilities/specialCharacters";
import {
  NAME_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  IModelInfoRequest,
  LOCALE_SHORTCODE_MAX_LENGTH,
  ModelInfoResponseErrorCodes
} from "api-specifications/modelInfo";
import {getIModelInfoMockData} from "./testDataHelper";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";

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
    // GIVEN a valid request (method & header & payload)
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

    // WHEN the info handler is invoked with the event param
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to call the repository with the given payload
    expect(getRepositoryRegistry().modelInfo.create).toHaveBeenCalledWith(givenPayload);
    // AND to respond with the INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    // AND the response body to be the expectedErrorBody
    const expectedErrorBody: IErrorResponse = {
      "errorCode": ModelInfoResponseErrorCodes.DB_FAILED_TO_CREATE_MODEL,
      "message": "Failed to create the model in the DB",
      "details": "",
    }
    expect(JSON.parse(actualResponse.body)).toMatchObject(expectedErrorBody);
  });

  test.each([
    HTTP_VERBS.PUT,
    HTTP_VERBS.DELETE,
    HTTP_VERBS.OPTIONS,
    HTTP_VERBS.PATCH,
    HTTP_VERBS.GET
  ])
  ("%s should respond with METHOD_NOT_ALLOWED error",
    async (param) => {
      // GIVEN an event with a non POST method
      const givenEvent = {httpMethod: param};

      // WHEN the model handler is invoked with the given event
      // @ts-ignore
      const actualResponse = await modelHandler(givenEvent);

      // THEN expect the handler to respond with METHOD_NOT_ALLOWED status
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
    });

  test("POST should respond with the UNSUPPORTED_MEDIA_TYPE status code if the content type is not application/json", async () => {
    // GIVEN a request (method & header & payload) with a non application/json content type
    const givenPayload = {
      previousUUID: randomUUID(),
      originUUID: randomUUID(),
      locale: {
        UUID: randomUUID(),
        name: 'ZA',
        shortCode: 'SA'
      },
      description: 'some text',
      released: false,
      releaseNotes: 'some text',
      version: 'v1.0.0'
    }
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'text/html'
      }
    }
    // AND the repository would return some model info
    const givenModelInfoRepositoryMock = {
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null)
    };

    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the info handler is invoked with the given event request
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with UNSUPPORTED_MEDIA_TYPE status
    expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
  });

  test("POST should respond with the BAD_REQUEST status code if payload does not conform to the model json schema", async () => {
    // GIVEN a request (method & header & a payload that does not conform to the model info schema)
    const givenPayload = {foo: "foo"}
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    // AND the repository would return some model info
    const givenModelInfoRepositoryMock = {
      Model: undefined as any,
      create: jest.fn().mockResolvedValue({}),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null)
    };
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the info handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body to be the expectedErrorBody
    const expectedErrorBody: IErrorResponse = {
      "errorCode": ModelInfoResponseErrorCodes.MODEL_COULD_NOT_VALIDATE,
      "message": "Payload should conform to schema",
      "details": "Payload should conform to schema",
    }
    expect(JSON.parse(actualResponse.body)).toEqual(
      expect.objectContaining({
        errorCode: expectedErrorBody.errorCode,
        message: expectedErrorBody.message
      })
    );

  });

  test.each([
    ["a malformed json", '{'],
    ["a string", 'foo'],
  ])
  ("POST should respond with the BAD_REQUEST if model body is %s", async (description, payload) => {
    // GIVEN a request (method & header & payload)
    const givenPayload = payload
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: givenPayload,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    // AND the repository would return some model info
    const givenModelInfoRepositoryMock = {
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null)
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the info handler is invoked with then given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent, null, null);

    // THEN expect the handler to respond with BAD_REQUEST status
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body to be the expectedErrorBody
    const expectedErrorBody: IErrorResponse = {
      "errorCode": ErrorCodes.MALFORMED_BODY,
      "message": "Payload is malformed, it should be a valid model json",
      "details": "any text",
    }
    expect(JSON.parse(actualResponse.body)).toEqual(
      expect.objectContaining({
        errorCode: expectedErrorBody.errorCode,
        message: expectedErrorBody.message
      })
    );
  });
})