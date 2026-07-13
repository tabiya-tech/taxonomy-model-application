// silence chatty console
import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import { SchemaObject } from "ajv";
import ErrorAPISpecs from "api-specifications/error";
import { validateEvent, validateSchema } from "./validateRequest";
import { StatusCodes } from "server/httpUtils";

const givenSchema: SchemaObject = {
  $id: "test://validateRequest/testPayloadSchema",
  type: "object",
  properties: {
    name: { type: "string" },
  },
  required: ["name"],
  additionalProperties: false,
};

const givenMaxPayloadLength = 100;

function getEvent(options: { body?: string; contentType?: string | null }): APIGatewayProxyEvent {
  const headers: Record<string, string> = {};
  if (options.contentType !== null) {
    headers["Content-Type"] = options.contentType ?? "application/json";
  }
  return {
    body: options.body ?? JSON.stringify({ name: "foo" }),
    headers,
  } as never;
}

describe("Test the validateSchema function", () => {
  test("should return the payload when it conforms to the schema", () => {
    // GIVEN a payload that conforms to the schema
    const givenPayload = { name: "foo" };

    // WHEN validating the payload against the schema
    const actualResult = validateSchema(givenSchema, givenPayload);

    // THEN expect the payload to be returned without an error response
    expect(actualResult.payload).toEqual(givenPayload);
    expect(actualResult.errorResponse).toBeUndefined();
  });

  test("should return the INVALID_JSON_SCHEMA error response when the payload does not conform to the schema", () => {
    // GIVEN a payload that does not conform to the schema
    const givenPayload = { foo: "bar" };

    // WHEN validating the payload against the schema
    const actualResult = validateSchema(givenSchema, givenPayload);

    // THEN expect an error response with the BAD_REQUEST status code and the INVALID_JSON_SCHEMA error code
    expect(actualResult.payload).toBeUndefined();
    expect(actualResult.errorResponse!.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResult.errorResponse!.body).errorCode).toEqual(
      ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA
    );
  });
});

describe("Test the validateEvent function", () => {
  test("should return the parsed payload when the event is valid", () => {
    // GIVEN a valid event
    const givenPayload = { name: "foo" };
    const givenEvent = getEvent({ body: JSON.stringify(givenPayload) });

    // WHEN validating the event
    const actualResult = validateEvent(givenEvent, givenSchema, givenMaxPayloadLength);

    // THEN expect the parsed payload to be returned without an error response
    expect(actualResult.payload).toEqual(givenPayload);
    expect(actualResult.errorResponse).toBeUndefined();
  });

  test.each([
    ["is not json", "text/html"],
    ["is missing", null],
  ])(
    "should return the UNSUPPORTED_MEDIA_TYPE error response when the content type %s",
    (_description, givenContentType) => {
      // GIVEN an event with an invalid content type
      const givenEvent = getEvent({ contentType: givenContentType });

      // WHEN validating the event
      const actualResult = validateEvent(givenEvent, givenSchema, givenMaxPayloadLength);

      // THEN expect an error response with the UNSUPPORTED_MEDIA_TYPE status code
      expect(actualResult.payload).toBeUndefined();
      expect(actualResult.errorResponse!.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    }
  );

  test("should return the TOO_LARGE_PAYLOAD error response when the body is longer than the maximum payload length", () => {
    // GIVEN an event with a body that is longer than the maximum payload length
    const givenEvent = getEvent({ body: "a".repeat(givenMaxPayloadLength + 1) });

    // WHEN validating the event
    const actualResult = validateEvent(givenEvent, givenSchema, givenMaxPayloadLength);

    // THEN expect an error response with the TOO_LARGE_PAYLOAD status code
    expect(actualResult.payload).toBeUndefined();
    expect(actualResult.errorResponse!.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    expect(JSON.parse(actualResult.errorResponse!.body).errorCode).toEqual(
      ErrorAPISpecs.Constants.ErrorCodes.TOO_LARGE_PAYLOAD
    );
  });

  test("should return the MALFORMED_BODY error response when the body is not valid json", () => {
    // GIVEN an event with a body that is not valid json
    const givenEvent = getEvent({ body: "{ not json" });

    // WHEN validating the event
    const actualResult = validateEvent(givenEvent, givenSchema, givenMaxPayloadLength);

    // THEN expect an error response with the BAD_REQUEST status code and the MALFORMED_BODY error code
    expect(actualResult.payload).toBeUndefined();
    expect(actualResult.errorResponse!.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResult.errorResponse!.body).errorCode).toEqual(
      ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY
    );
  });

  test("should return the INVALID_JSON_SCHEMA error response when the body does not conform to the schema", () => {
    // GIVEN an event with a body that does not conform to the schema
    const givenEvent = getEvent({ body: JSON.stringify({ foo: "bar" }) });

    // WHEN validating the event
    const actualResult = validateEvent(givenEvent, givenSchema, givenMaxPayloadLength);

    // THEN expect an error response with the BAD_REQUEST status code and the INVALID_JSON_SCHEMA error code
    expect(actualResult.payload).toBeUndefined();
    expect(actualResult.errorResponse!.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResult.errorResponse!.body).errorCode).toEqual(
      ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA
    );
  });
});
