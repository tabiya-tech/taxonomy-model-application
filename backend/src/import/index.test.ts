import * as ImportHandler from "./index";
import {HTTP_VERBS, response, StatusCodes, STD_ERRORS_RESPONSES} from "server/httpUtils";
import {ErrorCodes, IErrorResponse} from "api-specifications/error";
import * as AsyncImport from "./asyncImport";
import {ImportRequest, ImportResponseErrorCodes} from "api-specifications/import";

import {getMockId} from "_test_utilities/mockMongoId";
import {APIGatewayProxyEvent} from "aws-lambda";


describe("test for trigger ImportHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST should respond with the response from the lambda_invokeAsyncImport()", async () => {
    // GIVEN a correct payload & event with 'Content-Type: application/json; charset=utf-8'
    const givenPayload: ImportRequest = {
      modelId: getMockId(2),
      filePaths: {
        ISCO_GROUP: "path/to/file6",
        ESCO_OCCUPATION: "path/to/file7",
      }
    }
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    } as any
    // AND the lambda_invokeAsyncImport function will successfully handle the event and return a response
    const givenResponse = response(StatusCodes.ACCEPTED, {})
    const givenLambdaInvokeAsyncImportSpy = jest.spyOn(AsyncImport, "lambda_invokeAsyncImport").mockResolvedValueOnce(
      givenResponse
    );

    // WHEN the handler is invoked with the given event
    const actualResponse = await ImportHandler.handler(givenEvent);

    // THEN expect lambda_invokeAsyncImport function to be called with the given payload
    expect(givenLambdaInvokeAsyncImportSpy).toBeCalledWith(givenPayload);
    // AND the handler to return the response from the lambda_invokeAsyncImport function
    expect(actualResponse).toEqual(givenResponse);
  });

  test.each([
    HTTP_VERBS.PUT,
    HTTP_VERBS.DELETE,
    HTTP_VERBS.OPTIONS,
    HTTP_VERBS.PATCH,
    HTTP_VERBS.GET
  ])
  ("%s should respond with METHOD_NOT_ALLOWED error",
    async (givenMethod) => {
      // GIVEN an event with the given http method
      const givenEvent = {httpMethod: givenMethod};

      // WHEN the handler is invoked with the given event
      // @ts-ignore
      const actualResponse = await ImportHandler.handler(givenEvent);

      // THEN expect the handler to respond with METHOD_NOT_ALLOWED status code
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
    });

  test("POST should respond with UNSUPPORTED_MEDIA_TYPE if content type is invalid, ", async () => {
    // GIVEN a payload & event that does not have 'Content-Type: application/json'
    const givenPayload: ImportRequest = {
      modelId: getMockId(2),
      // @ts-ignore
      urls: {
        ISCO_GROUP: "https://example.com/folder/file6",

      }
    }
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'text/html' // <----- content type is invalid
      }
    }

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await ImportHandler.handler(givenEvent, null, null);

    // THEN expect the handler to respond with UNSUPPORTED_MEDIA_TYPE status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    // AND the response body to contain the error information
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
  ("POST should respond with BAD_REQUEST if trigger request body %s", async (description, givenPayload) => {
    // GIVEN an event with the given payload
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: givenPayload,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await ImportHandler.handler(givenEvent);

    // THEN expect the handler to respond with BAD_REQUEST status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body to contain the error information
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

  test("POST should respond with the BAD_REQUEST if Request does not conform to schema", async () => {
    // GIVEN a payload that does not conform to schema & event
    const givenPayload = {foo: "foo"}
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    }

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await ImportHandler.handler(givenEvent);

    // THEN expect the handler to respond with BAD_REQUEST status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    // AND the response body to contain the error information
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