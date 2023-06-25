import * as config from "server/config/config";
import * as transformModule from "./transform";
import {handler as modelHandler} from "./index";
import {HTTP_VERBS, StatusCodes, STD_ERRORS_RESPONSES} from "server/httpUtils";

import {DESCRIPTION_MAX_LENGTH, IModelInfo, NAME_MAX_LENGTH} from "./modelInfoModel";
import {randomUUID} from "crypto";
import {ErrorCodes, IErrorResponse} from "api-specifications/error";
import {getRandomString} from "_test_utilities/specialCharacters";
import {
  IModelInfoRequest,
  LOCALE_SHORTCODE_MAX_LENGTH,
  ModelInfoResponseErrorCodes
} from "api-specifications/modelInfo";
import {getIModelInfoMockData} from "./testDataHelper";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";

const transformSpy = jest.spyOn(transformModule, "transform");


describe("test for model handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST should respond with the CREATED and the model, ", async () => {
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

    // AND repository successfully creates a model
    const expectedModelInfo: IModelInfo = getIModelInfoMockData();

    const modelInfoMock = {
      Model: undefined,
      create: jest.fn().mockResolvedValue(expectedModelInfo),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null)
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(modelInfoMock);

    //WHEN the info handler is invoked with the event
    //@ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to call the repository with the payload
    expect(getRepositoryRegistry().modelInfo.create).toHaveBeenCalledWith(givenPayload);
    // AND expect to respond with status CREATED
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    // AND expect the handler to return the correct headers
    expect(actualResponse.headers).toMatchObject({"Content-Type": "application/json"});
    // AND the transformation function is called correctly
    expect(transformModule.transform).toHaveBeenCalledWith(expectedModelInfo, givenResourcesBaseUrl);
    // AND expect the handler to return the result of the transformation function
    expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
  });

  it('POST should respond with the INTERNAL_SERVER_ERROR if it fails to repository failed to respond ', async () => {
    //GIVEN a valid payload
    const givenPayload = {
      name: 'foo',
      locale: {
        UUID: randomUUID(),
        name: 'ZA',
        shortCode: 'SA'
      },
      description: 'some text',
    }

    // AND event
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    }

    // AND repository fails to  create a model
    const modelInfoMock = {
      Model: undefined,
      create: jest.fn().mockRejectedValue(new Error("foo")),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null)
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(modelInfoMock);

    //WHEN the info handler is invoked with event param
    //@ts-ignore
    const actualResponse = await modelHandler(givenEvent, null, null);
    // THEN expects created is called
    expect(getRepositoryRegistry().modelInfo.create).toHaveBeenCalledWith(givenPayload);
    //AND  expect response to be Created and the model
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    // AND expect  created
    // error response status >=400 represents an error
    const expectedErrorBody: IErrorResponse = {
      "errorCode": ModelInfoResponseErrorCodes.DB_FAILED_TO_CREATE_MODEL,
      "message": "Failed to create the model in the DB",
      "details": "",
    }
    expect(JSON.parse(actualResponse.body)).toMatchObject(expectedErrorBody);
  });

  it.each([
    HTTP_VERBS.PUT,
    HTTP_VERBS.DELETE,
    HTTP_VERBS.OPTIONS,
    HTTP_VERBS.PATCH,
    HTTP_VERBS.GET
  ])
  ("%s should respond with NOT_FOUND error",
    async (param) => {
      //GIVEN an event with a non POST method
      const event = {httpMethod: param};

      //WHEN the model handler is invoked
      //@ts-ignore
      const actualResponse = await modelHandler(event, null, null);

      //THEN expect status to be 400
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
    });

  it("POST should respond with the UNSUPPORTED_MEDIA_TYPE if content type is invalid, ", async () => {
    //GIVEN a payload
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

    // AND event
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'text/html'
      }
    }

    const modelInfoMock = {
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null)
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(modelInfoMock);

    //WHEN the info handler is invoked with event param
    //@ts-ignore
    const actualResponse = await modelHandler(givenEvent, null, null);
    //THEN  expect response to be Created and the model
    expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    // AND expect  created
  });

  test("POST should respond with the BAD_REQUEST if payload doe not conform to the model schema", async () => {
    //GIVEN a payload that does not conform to the model schema
    const givenPayload = {foo: "foo"}
    // AND event
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    // AND error response status =400 represents an error
    const expectedErrorBody: IErrorResponse = {
      "errorCode": ModelInfoResponseErrorCodes.MODEL_COULD_NOT_VALIDATE,
      "message": "Payload should conform to schema",
      "details": "Payload should conform to schema",
    }


    const modelInfoMock = {
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null)
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(modelInfoMock);


    //WHEN the info handler is invoked with event param
    //@ts-ignore
    const actualResponse = await modelHandler(givenEvent, null, null);
    //THEN  expect response to be Created and the model
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND expect  created
    expect(JSON.parse(actualResponse.body)).toEqual(
      expect.objectContaining({
        errorCode: expectedErrorBody.errorCode,
        message: expectedErrorBody.message
      })
    );

  });


  test.each([
    ["is a malformed json", '{'],
    ["is a string", 'foo'],
  ])
  ("POST should respond with the BAD_REQUEST if model body is %s", async (description, payload) => {
    //GIVEN a payload
    const givenPayload = payload
    // AND event
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: givenPayload,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    // AND error response status =400 represents an error
    const expectedErrorBody: IErrorResponse = {
      "errorCode": ErrorCodes.MALFORMED_BODY,
      "message": "Payload is malformed, it should be a valid model json",
      "details": "any text",
    }

    const modelInfoMock = {
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      getModelById: jest.fn().mockResolvedValue(null),
      getModelByUUID: jest.fn().mockResolvedValue(null)
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(modelInfoMock);

    //WHEN the info handler is invoked with event param
    //@ts-ignore
    const actualResponse = await modelHandler(givenEvent, null, null);
    //THEN  expect response to be Created and the model
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND expect  created
    expect(JSON.parse(actualResponse.body)).toEqual(
      expect.objectContaining({
        errorCode: expectedErrorBody.errorCode,
        message: expectedErrorBody.message
      })
    );
  });
})