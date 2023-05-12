import Ajv from 'ajv';
import addFormats from "ajv-formats";

import {
  errorResponse,
  response,
  STD_ERRORS_RESPONSES
} from "./httpUtils";

import {ErrorResponseSchema, IErrorResponse} from "api-specifications/error";
describe("test response function", () => {

  test("should return correct response for an object", () => {
    // GIVEN a status code
    const givenStatusCode = 200;
    // AND a javascript object
    const givenObject = {bar: "baz"};

    //WHEN response is invoked for the given status javascript object
    const result = response(givenStatusCode, givenObject);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of the given object
    expect(result.body).toEqual(JSON.stringify(givenObject));
    // AND CORS headers to be set
    expect(result.headers).toEqual({"Access-Control-Allow-Origin": "*"});
    // AND isBase64Encoded to be false
    expect(result.isBase64Encoded).toEqual(false);
  });

  test("should return correct response for a string", () => {
    // GIVEN a status code
    const givenStatusCode = 200;
    // AND a string
    const givenString = JSON.stringify({bar: "baz"});

    //WHEN response is invoked for the given status and string
    const result = response(givenStatusCode, givenString);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be the  given string
    expect(result.body).toEqual(givenString);
    // AND CORS headers to be set
    expect(result.headers).toEqual({"Access-Control-Allow-Origin": "*"});
    // AND isBase64Encoded to be false
    expect(result.isBase64Encoded).toEqual(false);
  });
});

describe("test the errorResponse function", () => {
  test("should return correct response for an error", () => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND some error details
    const givenError: IErrorResponse = {
      errorCode: "error",
      message: "message",
      details: "details"
    };

    //WHEN errorResponse is invoked for the given status and error
    const result = errorResponse(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify(givenError));
    // AND a body should validate against the ErrorResponse schema
    const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    addFormats(ajv);
    const validateResponse = ajv.compile(ErrorResponseSchema);
    validateResponse(JSON.parse(result.body));
    expect(validateResponse.errors).toBeNull();
  });
  test.each([
    ["undefined", undefined],
    ["null", null],
  ])
  ("should return correct response for an error even is some properties are %s", (description, value) => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND some error details
    const givenError: IErrorResponse = {
      errorCode: "error",
      // @ts-ignore
      message: value,
      // @ts-ignore
      details: value
    };

    //WHEN errorResponse is invoked for the given status and error
    const result = errorResponse(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify({...givenError, message: "", details: ""}));
    // AND a body should validate against the ErrorResponse schema
    const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    addFormats(ajv);
    const validateResponse = ajv.compile(ErrorResponseSchema);
    validateResponse(JSON.parse(result.body));
    expect(validateResponse.errors).toBeNull();
  });

});


describe("test the STD_ERRORS_RESPONSES", () => {
  test("STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED", () => {
    expect(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED).toMatchSnapshot();
  });

  test("STD_ERRORS_RESPONSES.NOT_FOUND", () => {
    expect(STD_ERRORS_RESPONSES.NOT_FOUND).toMatchSnapshot();
  });

  test("STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR", () => {
    expect(STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR).toMatchSnapshot();
  });
});
