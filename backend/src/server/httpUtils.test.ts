//silence chatty console
import "_test_utilities/consoleMock";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import "jest-performance-matchers";

import ErrorAPISpecs from "api-specifications/error";
import process from "process";
import {
  errorResponse,
  errorResponseGET,
  errorResponsePATCH,
  errorResponsePOST,
  response,
  STD_ERRORS_RESPONSES,
} from "./httpUtils";

describe("test response function", () => {
  const originalEnv: { [key: string]: string } = {};
  // Backup and restore the original env variables
  beforeAll(() => {
    Object.keys(process.env).forEach((key) => {
      originalEnv[key] = process.env[key] as string;
    });
  });

  afterAll(() => {
    // Restore original env variables
    Object.keys(process.env).forEach((key) => {
      delete process.env[key];
    });
    Object.keys(originalEnv).forEach((key) => {
      process.env[key] = originalEnv[key];
    });
  });
  test("should return correct response for an object in the dev environment", () => {
    // GIVEN a status code
    const givenStatusCode = 200;
    // AND a javascript object
    const givenObject = { bar: "baz" };
    // AND the TARGET_ENVIRONMENT environment variable is set to "dev"
    process.env.TARGET_ENVIRONMENT = "dev";
    //WHEN response is invoked for the given status javascript object
    const result = response(givenStatusCode, givenObject);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of the given object
    expect(result.body).toEqual(JSON.stringify(givenObject));
    // AND CORS headers to be set
    expect(result.headers).toEqual({ "Access-Control-Allow-Origin": "*" });
    // AND isBase64Encoded to be false
    expect(result.isBase64Encoded).toEqual(false);
  });

  test("should return correct response for an object in an environment that is not dev", () => {
    // GIVEN a status code
    const givenStatusCode = 200;
    // AND a javascript object
    const givenObject = { bar: "baz" };
    // AND the TARGET_ENVIRONMENT environment variable is set to "prod"
    process.env.TARGET_ENVIRONMENT = "prod";
    // AND the DOMAIN_NAME environment variable is set to "foo.bar.baz"
    process.env.DOMAIN_NAME = "foo.bar.baz";

    //WHEN response is invoked for the given status javascript object
    const result = response(givenStatusCode, givenObject);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of the given object
    expect(result.body).toEqual(JSON.stringify(givenObject));
    // AND CORS headers to be set
    expect(result.headers).toEqual({ "Access-Control-Allow-Origin": "foo.bar.baz" });
    // AND isBase64Encoded to be false
    expect(result.isBase64Encoded).toEqual(false);
  });

  test("should return correct response for an object in an environment that is not dev when DOMAIN_NAME is not set", () => {
    // GIVEN a status code
    const givenStatusCode = 200;
    // AND a javascript object
    const givenObject = { bar: "baz" };
    // AND the TARGET_ENVIRONMENT environment variable is set to "prod"
    process.env.TARGET_ENVIRONMENT = "prod";
    // AND the DOMAIN_NAME environment variable is not set
    delete process.env.DOMAIN_NAME;

    //WHEN response is invoked for the given status javascript object
    const result = response(givenStatusCode, givenObject);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of the given object
    expect(result.body).toEqual(JSON.stringify(givenObject));
    // AND CORS headers to be empty
    expect(result.headers).toEqual({});
    // AND isBase64Encoded to be false
    expect(result.isBase64Encoded).toEqual(false);
  });

  test("should return correct response for a string", () => {
    // GIVEN a status code
    const givenStatusCode = 200;
    // AND a string
    const givenString = JSON.stringify({ bar: "baz" });
    // AND the TARGET_ENVIRONMENT environment variable is set to "dev"
    process.env.TARGET_ENVIRONMENT = "dev";

    //WHEN response is invoked for the given status and string
    const result = response(givenStatusCode, givenString);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be the  given string
    expect(result.body).toEqual(givenString);
    // AND CORS headers to be set
    expect(result.headers).toEqual({ "Access-Control-Allow-Origin": "*" });
    // AND isBase64Encoded to be false
    expect(result.isBase64Encoded).toEqual(false);
  });
});

describe("test the errorResponsePOST function", () => {
  test("should return correct response for an error", () => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND some error details
    const givenError: ErrorAPISpecs.Types.POST = {
      errorCode: ErrorAPISpecs.Constants.POST.ErrorCodes.INVALID_JSON_SCHEMA,
      message: "message",
      details: "details",
    };

    // WHEN errorResponsePOST is invoked for the given status and error
    const result = errorResponsePOST(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);

    // THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify(givenError));
    // AND a body should validate against the APIErrorPOST schema
    const ajv = new Ajv({
      validateSchema: true,
      strict: true,
      allErrors: true,
    });
    addFormats(ajv);
    const validateResponse = ajv.compile(ErrorAPISpecs.Schemas.POST.Payload);
    validateResponse(JSON.parse(result.body));
    expect(validateResponse.errors).toBeNull();
  });
  test.each([
    ["undefined", undefined],
    ["null", null],
  ])("should return correct response for an error even is some properties are %s", (description, value) => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND some error  details
    const givenError: ErrorAPISpecs.Types.POST = {
      errorCode: ErrorAPISpecs.Constants.POST.ErrorCodes.INVALID_JSON_SCHEMA,
      // @ts-ignore
      message: value,
      // @ts-ignore
      details: value,
    };

    // WHEN errorResponsePOST is invoked for the given status and error
    const result = errorResponsePOST(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);

    // THEN expect the statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify({ ...givenError, message: "", details: "" }));
    // AND a body should validate against the APIErrorPOST schema
    const ajv = new Ajv({
      validateSchema: true,
      strict: true,
      allErrors: true,
    });
    addFormats(ajv);
    const validateResponse = ajv.compile(ErrorAPISpecs.Schemas.POST.Payload);
    validateResponse(JSON.parse(result.body));
    expect(validateResponse.errors).toBeNull();
  });
});

describe("test the errorResponseGET function", () => {
  test("should return correct response for an error", () => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND some error details
    const givenError: ErrorAPISpecs.Types.GET = {
      errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
      message: "message",
      details: "details",
    };

    // WHEN errorResponseGET is invoked for the given status and error
    const result = errorResponseGET(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);
    // THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND a body should validate against the APIErrorGET schema
    const ajv = new Ajv({
      validateSchema: true,
      strict: true,
      allErrors: true,
    });

    addFormats(ajv);
    const validateResponse = ajv.compile(ErrorAPISpecs.Schemas.GET.Payload);
    validateResponse(JSON.parse(result.body));
    expect(validateResponse.errors).toBeNull();
  });
  test.each([
    ["undefined", undefined],
    ["null", null],
  ])("should return correct response for an error even is some properties are %s", (description, value) => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND some error details
    const givenError: ErrorAPISpecs.Types.GET = {
      errorCode: ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
      // @ts-ignore
      message: value,
      // @ts-ignore
      details: value,
    };

    // WHEN errorResponseGET is invoked for the given status and error
    const result = errorResponseGET(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);

    // THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify({ ...givenError, message: "", details: "" }));
    // AND a body should validate against the APIErrorGET schema
    const ajv = new Ajv({
      validateSchema: true,
      strict: true,
      allErrors: true,
    });
    addFormats(ajv);
    const validateResponse = ajv.compile(ErrorAPISpecs.Schemas.GET.Payload);
    validateResponse(JSON.parse(result.body));
    expect(validateResponse.errors).toBeNull();
  });
});

describe("test the errorResponsePATCH function", () => {
  test("should return correct response for an error", () => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND some error details
    const givenError: ErrorAPISpecs.Types.PATCH = {
      errorCode: ErrorAPISpecs.Constants.PATCH.ErrorCodes.INVALID_JSON_SCHEMA,
      message: "message",
      details: "details",
    };

    // WHEN errorResponsePATCH is invoked for the given status and error
    const result = errorResponsePATCH(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);

    // THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify(givenError));
    // AND a body should validate against the APIErrorPATCH schema
    const ajv = new Ajv({
      validateSchema: true,
      strict: true,
      allErrors: true,
    });
    addFormats(ajv);
    const validateResponse = ajv.compile(ErrorAPISpecs.Schemas.PATCH.Payload);
    validateResponse(JSON.parse(result.body));
    expect(validateResponse.errors).toBeNull();
  });
  test.each([
    ["undefined", undefined],
    ["null", null],
  ])("should return correct response for an error even is some properties are %s", (description, value) => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND some error details
    const givenError: ErrorAPISpecs.Types.PATCH = {
      errorCode: ErrorAPISpecs.Constants.PATCH.ErrorCodes.INVALID_JSON_SCHEMA,
      // @ts-ignore
      message: value,
      // @ts-ignore
      details: value,
    };
    // WHEN errorResponsePATCH is invoked for the given status and error
    const result = errorResponsePATCH(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);

    // THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify({ ...givenError, message: "", details: "" }));
    // AND a body should validate against the APIErrorPATCH schema
    const ajv = new Ajv({
      validateSchema: true,
      strict: true,
      allErrors: true,
    });
    addFormats(ajv);
    const validateResponse = ajv.compile(ErrorAPISpecs.Schemas.PATCH.Payload);
    validateResponse(JSON.parse(result.body));
    expect(validateResponse.errors).toBeNull();
  });
});

describe("test the errorResponse function", () => {
  test("should return correct response for an error", () => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND some error details
    const givenError: ErrorAPISpecs.Types.Payload = {
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INTERNAL_SERVER_ERROR,
      message: "message",
      details: "details",
    };

    //WHEN errorResponse is invoked for the given status and error
    const result = errorResponse(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify(givenError));
    // AND a body should validate against the APIError schema
    const ajv = new Ajv({
      validateSchema: true,
      strict: true,
      allErrors: true,
    });
    addFormats(ajv);
    const validateResponse = ajv.compile(ErrorAPISpecs.Schemas.Payload);
    validateResponse(JSON.parse(result.body));
    expect(validateResponse.errors).toBeNull();
  });
  test.each([
    ["undefined", undefined],
    ["null", null],
  ])("should return correct response for an error even is some properties are %s", (description, value) => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND some error details
    const givenError: ErrorAPISpecs.Types.Payload = {
      errorCode: ErrorAPISpecs.Constants.ErrorCodes.INTERNAL_SERVER_ERROR,
      // @ts-ignore
      message: value,
      // @ts-ignore
      details: value,
    };

    //WHEN errorResponse is invoked for the given status and error
    const result = errorResponse(givenStatusCode, givenError.errorCode, givenError.message, givenError.details);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify({ ...givenError, message: "", details: "" }));
    // AND a body should validate against the APIError schema
    const ajv = new Ajv({
      validateSchema: true,
      strict: true,
      allErrors: true,
    });
    addFormats(ajv);
    const validateResponse = ajv.compile(ErrorAPISpecs.Schemas.Payload);
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
