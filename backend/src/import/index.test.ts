import {handler as importHandler} from "./index";
import {HTTP_VERBS, response, StatusCodes, STD_ERRORS_RESPONSES} from "server/httpUtils";
import {ErrorCodes, IErrorResponse} from "api-specifications/error";
import * as AsyncImport from "./asyncImport";
import {ImportRequest, ImportResponseErrorCodes} from "api-specifications/import";

import {getMockId} from "_test_utilities/mockMongoId";
import {APIGatewayProxyEvent} from "aws-lambda";

describe("test for trigger import handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST should respond with the response from the callAsyncImport()", async () => {
    // GIVEN a payload
    const givenPayload: ImportRequest = {
      modelId: getMockId(2),
      filePaths: {
        ISCO_GROUP: "path/to/file6",
        ESCO_OCCUPATION: "path/to/file7",
      }
    }
    // AND event
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    } as any
    // AND a spy on callAsyncImport method
    const importHandlerSpy = jest.spyOn(AsyncImport, "lambda_invokeAsyncImport").mockResolvedValueOnce(
      response(StatusCodes.ACCEPTED, {})
    );

    // WHEN the info handler is invoked with event param
    const actualResponse = await importHandler(givenEvent);

    // THEN expect Info handler to be called with event
    expect(importHandlerSpy).toBeCalledWith(givenPayload);
    // AND  expect error message with unsupported code  to exist
    expect(actualResponse.statusCode).toEqual(StatusCodes.ACCEPTED);
  });

  test.each([
    HTTP_VERBS.PUT,
    HTTP_VERBS.DELETE,
    HTTP_VERBS.OPTIONS,
    HTTP_VERBS.PATCH,
    HTTP_VERBS.GET
  ])
  ("%s should respond with NOT_FOUND error",
    async (param) => {
      // GIVEN an event with a non POST method
      const givenEvent = {httpMethod: param};

      //WHEN the trigger import handler is invoked
      //@ts-ignore
      const actualResponse = await importHandler(givenEvent, null, null);

      // THEN expect status to be 400
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
    });

  test("POST should respond with the UNSUPPORTED_MEDIA_TYPE if content type is invalid, ", async () => {
    // GIVEN a payload
    const givenPayload: ImportRequest = {
      modelId: getMockId(2),
      // @ts-ignore
      urls: {
        ISCO_GROUP: "https://example.com/folder/file6",

      }
    }
    // AND event
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'text/html'
      }
    }

    //WHEN the info handler is invoked with event param
    //@ts-ignore
    const actualResponse = await importHandler(givenEvent, null, null);

    // THEN expect to respond with error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    // AND expect en error message in the body
    const expectedErrorBody: IErrorResponse = {
      "errorCode": ErrorCodes.UNSUPPORTED_MEDIA_TYPE,
      "message": "Content-Type should be application/json",
      "details": "Received Content-Type:text/html",
    }
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test.each([
    ["is a malformed json", '{'],
    ["is a string", 'foo'],
  ])
  ("POST should respond with the BAD_REQUEST if trigger import body is %s", async (description, payload) => {
    // GIVEN a payload
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    //WHEN the info handler is invoked with event param
    //@ts-ignore
    const actualResponse = await importHandler(givenEvent, null, null);

    // THEN expect to respond with error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND expect en error message in the body
    // AND error response status =4 00 represents an error
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

  test("POST should respond with the BAD_REQUEST if Request does not conform to schema %s", async () => {
    // GIVEN a payload
    const givenPayload = {foo: "foo"}
    // AND event
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    }

    //WHEN the info handler is invoked with event param
    //@ts-ignore
    const actualResponse = await importHandler(givenEvent, null, null);

    // THEN expect to respond with error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND expect en error message in the body
    const expectedErrorBody: IErrorResponse = {
      "errorCode": ImportResponseErrorCodes.TRIGGER_IMPORT_COULD_NOT_VALIDATE,
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
})