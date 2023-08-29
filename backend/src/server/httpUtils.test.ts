import Ajv from 'ajv';
import addFormats from "ajv-formats";
import 'jest-performance-matchers';
import {errorResponse, redactCredentialsFromURI, response, STD_ERRORS_RESPONSES} from "./httpUtils";

import APIError from "api-specifications/error";

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
    const givenError: APIError.POST.Response.Payload = {
      errorCode: APIError.Constants.ErrorCodes.INTERNAL_SERVER_ERROR,
      message: "message",
      details: "details"
    };

    //WHEN errorResponse is invoked for the given status and error
    const result = errorResponse(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify(givenError));
    // AND a body should validate against the APIError schema
    const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    addFormats(ajv);
    const validateResponse = ajv.compile(APIError.POST.Response.Schema);
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
    const givenError: APIError.POST.Response.Payload = {
      errorCode: APIError.Constants.ErrorCodes.INTERNAL_SERVER_ERROR,
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
    // AND a body should validate against the APIError schema
    const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    addFormats(ajv);
    const validateResponse = ajv.compile(APIError.POST.Response.Schema);
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

describe("test the redactCredentialsFromURI function", () => {

  describe("test typical uri", () => {
    test.each(
      [
        ["http://foo.bar"],
        ["http://foo/bar"],
        ["http://foo/bar?baz=qux"],
        ["https://example.com:8080"],
        ["mongodb://example.com:8080/"], // NOSONAR
      ]
    )
    ("should return the same URI %s if no credentials are present", (uri: string) => {
      const result = redactCredentialsFromURI(uri);
      expect(result).toEqual(uri);
    });

    test.each(
      [
        ["http://user:password@foo.bar", "http://*:*@foo.bar"],
        ["http://user:password@foo/bar", "http://*:*@foo/bar"],
        ["http://user:password@foo/bar?baz=qux", "http://*:*@foo/bar?baz=qux"],
        ["https://user:password@example.com:8080", "https://*:*@example.com:8080"],
        ["mongodb://user:password@example.com:8080/", "mongodb://*:*@example.com:8080/"], // NOSONAR
      ]
    )("should return the redacted URI %s if credentials are present", (uriWithCredentials, uriWithoutCredential) => {
      const result = redactCredentialsFromURI(uriWithCredentials);
      expect(result).toEqual(uriWithoutCredential);
    });
  });
  describe("test credentials are malformed", () => {
    test.each(
      [
        ["//user:password@foo.bar", "//*:*@foo.bar"],
        ["://user:password@foo/bar", "://*:*@foo/bar"],
        ["http://user:@foo/bar?baz=qux", "http://*:*@foo/bar?baz=qux"],
        ["https://user@example.com:8080", "https://*:*@example.com:8080"],
        ["mongodb://:password@example.com:8080/", "mongodb://*:*@example.com:8080/"], // NOSONAR
        ["mongodb://user:password@user:password@example.com:8080/", "mongodb://*:*@example.com:8080/"], // NOSONAR
      ]
    )("should return the redacted URI %s if credentials are malformed", (uriWithCredentials, uriWithoutCredential) => {
      const result = redactCredentialsFromURI(uriWithCredentials);
      expect(result).toEqual(uriWithoutCredential);
    });
  });

  describe("test function performance", () => {
    const PERF_DURATION = 10;
    test.each([
      ["plain http", "http://foo/bar?baz=qux"],
      ["http with credentials", "http://username:password@foo/bar?baz=qux"],
      ["only username", "http://username:@foo/bar?baz=qux"],
      ["only password", "http://:@foo/bar?baz=qux"],
      ["(extreme long) plain http", "http://foo/bar?baz=" + "qux".repeat(65535)],
      ["(extreme long) with credentials ", "http://" + "username".repeat(32000) + ":" + "password".repeat(32000) + "@foo/bar?baz=" + "qux".repeat(65535)],
      ["(extreme long) only username ", "http://" + "username".repeat(32000) + "@foo/bar?baz=" + "qux".repeat(65535)],
      ["(extreme long) only password ", "http://:" + "username".repeat(32000) + "@foo/bar?baz=" + "qux".repeat(65535)],
      ["(extreme long) with multiple user name passwords", "http://:" + "username:password".repeat(32000) + "@foo/bar?baz=" + "qux".repeat(65535)],
    ])(`It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`, (description, uri) => {
      expect(() => {
        redactCredentialsFromURI(uri);
      }).toCompleteWithinQuantile(PERF_DURATION, {iterations: 10, quantile: 90});
    });
  });
});