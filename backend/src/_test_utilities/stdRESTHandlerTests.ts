/* eslint-disable no-unexpected-multiline */
import { HTTP_VERBS, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { APIGatewayProxyEvent, Callback, Context } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";

function assertErrorResponse(actualResponse: APIGatewayProxyResult, expectedResponse: APIGatewayProxyResult) {
  expect(actualResponse.statusCode).toEqual(expectedResponse.statusCode);
  const expectedResponseBody = JSON.parse(expectedResponse.body);
  expect(JSON.parse(actualResponse.body)).toEqual({
    errorCode: expectedResponseBody.errorCode,
    message: expectedResponseBody.message,
    details: expect.any(String),
  });
}

export function testMethodsNotAllowed(
  notAllowedMethods: HTTP_VERBS[],
  handler: (event: APIGatewayProxyEvent, context: Context, callback: Callback) => Promise<APIGatewayProxyResult>
) {
  describe("test methods not allowed", () => {
    test.each(notAllowedMethods)("%s should respond with METHOD_NOT_ALLOWED error", async (givenMethod) => {
      // GIVEN an event with the given http method
      const givenEvent = { httpMethod: givenMethod };

      // WHEN the handler is invoked with the given event
      // @ts-ignore
      const actualResponse = await handler(givenEvent);

      // THEN expect the handler to respond with METHOD_NOT_ALLOWED status code and body that contains the error details
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
    });
  });
}

export function testRequestJSONMalformed(
  handler: (event: APIGatewayProxyEvent, context: Context, callback: Callback) => Promise<APIGatewayProxyResult>
) {
  test.each([
    ["is a malformed json", "{"],
    ["is a string", "foo"],
  ])("POST should respond with BAD_REQUEST if request body %s", async (description, givenPayload) => {
    // GIVEN an event with the given payload
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: givenPayload,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await handler(givenEvent);

    // THEN expect the handler to respond with BAD_REQUEST status code and the error information
    const expectedResponse = STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR("anything");
    assertErrorResponse(actualResponse, expectedResponse);
  });
}

export function testRequestJSONSchema(
  handler: (event: APIGatewayProxyEvent, context: Context, callback: Callback) => Promise<APIGatewayProxyResult>
) {
  test("POST should respond with the BAD_REQUEST if Request does not conform to schema", async () => {
    // GIVEN a payload that does not conform to schema & event
    const givenBadPayload = { foo: "foo" };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenBadPayload),
      headers: {
        "Content-Type": "application/json",
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await handler(givenEvent);

    // THEN expect the handler to respond with BAD_REQUEST status code and the error information
    const expectedResponse = STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR("anything");
    assertErrorResponse(actualResponse, expectedResponse);
  });
}

export function testUnsupportedMediaType(
  handler: (event: APIGatewayProxyEvent, context: Context, callback: Callback) => Promise<APIGatewayProxyResult>
) {
  test("POST should respond with UNSUPPORTED_MEDIA_TYPE if content type is invalid, ", async () => {
    // GIVEN any payload & an event that does not have 'Content-Type: application/json'
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify({ foo: "foo" }),
      headers: {
        "Content-Type": "text/html", // <----- content type is invalid
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await handler(givenEvent, null, null);

    // THEN expect the handler to respond with UNSUPPORTED_MEDIA_TYPE status code and the error information
    expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR);
  });
}

export function testTooLargePayload(
  httpMethod: HTTP_VERBS,
  maxPayload: number,
  handler: (event: APIGatewayProxyEvent, context: Context, callback: Callback) => Promise<APIGatewayProxyResult>
) {
  test("POST should respond with TOO_LARGE_PAYLOAD if request body is too long", async () => {
    // GIVEN an event with a payload that is too long
    const givenPayload = "a".repeat(maxPayload + 1);
    const givenEvent = {
      httpMethod: httpMethod,
      body: givenPayload,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await handler(givenEvent);

    // THEN expect the handler to respond with TOO_LARGE_PAYLOAD status code and the error information
    const expectedResponse = STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR("anything");
    assertErrorResponse(actualResponse, expectedResponse);
  });
}
