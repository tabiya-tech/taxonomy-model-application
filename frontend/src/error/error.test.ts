import { ErrorCodes } from "./errorCodes";
import {
  getServiceErrorFactory,
  ServiceError,
  getUserFriendlyErrorMessage,
  USER_FRIENDLY_ERROR_MESSAGES,
} from "./error";
import { StatusCodes } from "http-status-codes/";

describe("Test the ServiceError class", () => {
  it.each([
    ["string", "some string"],
    ["IErrorResponse", { errorCode: ErrorCodes.API_ERROR, message: "message", details: "details" }],
    ["any object", { foo: "bar" }],
    ["undefined", undefined],
    ["null", null],
  ])("should create a ServiceError object with %s details", (description, detailsValue) => {
    // GIVEN a service name, function, method, path, status code, error code, message and details as string
    const givenServiceName = "service";
    const givenServiceFunction = "function";
    const givenMethod = "method";
    const givenPath = "path";
    const givenStatusCode = 400;
    const givenErrorCode = ErrorCodes.API_ERROR;
    const givenMessage = "message";
    const givenDetails = detailsValue;

    // WHEN creating a ServiceError object
    const actual = new ServiceError(
      givenServiceName,
      givenServiceFunction,
      givenMethod,
      givenPath,
      givenStatusCode,
      givenErrorCode,
      givenMessage,
      givenDetails
    );
    // THEN the object should be created
    expect(actual).toBeDefined();
    // AND the object should be an instance of ServiceError
    expect(actual).toBeInstanceOf(ServiceError);
    // AND the object should be an instance of Error
    expect(actual).toBeInstanceOf(Error);
    // AND the object should have the given parameters
    expect(actual.serviceName).toBe(givenServiceName);
    expect(actual.serviceFunction).toBe(givenServiceFunction);
    expect(actual.method).toBe(givenMethod);
    expect(actual.path).toBe(givenPath);
    expect(actual.statusCode).toBe(givenStatusCode);
    expect(actual.errorCode).toBe(givenErrorCode);
    expect(actual.message).toBe(givenMessage);
    expect(actual.details).toBe(givenDetails);
  });
});

describe("Test the getServiceErrorFactory function", () => {
  it("should return a ServiceErrorFactory", () => {
    // GIVEN a service name, function, method and path
    const givenServiceName = "service";
    const givenServiceFunction = "function";
    const givenMethod = "method";
    const givenPath = "path";

    // WHEN calling getServiceErrorFactory
    const errorFactory = getServiceErrorFactory("service", "function", "method", "path");

    // THEN the function should return a ServiceErrorFactory
    expect(errorFactory).toBeDefined();
    expect(errorFactory).toBeInstanceOf(Function);
    // AND the ServiceErrorFactory should return a ServiceError
    const givenStatusCode = 400;
    const givenErrorCode = ErrorCodes.API_ERROR;
    const givenMessage = "message";
    const givenDetails = "details";
    const actualError = errorFactory(givenStatusCode, givenErrorCode, givenMessage, givenDetails);
    // AND the ServiceError should have the given parameters
    expect(actualError.serviceName).toBe(givenServiceName);
    expect(actualError.serviceFunction).toBe(givenServiceFunction);
    expect(actualError.method).toBe(givenMethod);
    expect(actualError.path).toBe(givenPath);
    expect(actualError.statusCode).toBe(givenStatusCode);
    expect(actualError.errorCode).toBe(givenErrorCode);
    expect(actualError.message).toBe(givenMessage);
    expect(actualError.details).toBe(givenDetails);
  });
});

describe("Test the getUserFriendlyErrorMessage function", () => {
  it("should return UNEXPECTED_ERROR for non-ServiceError errors", () => {
    // GIVEN a random error
    const error = new Error("Random error");
    // WHEN calling getUserFriendlyErrorMessage
    const message = getUserFriendlyErrorMessage(error);
    // THEN the function should return a generic error message
    expect(message).toBe(USER_FRIENDLY_ERROR_MESSAGES.UNEXPECTED_ERROR);
  });

  describe("ErrorCodes", () => {
    describe("should return correct message for 'API_ERROR' error code", () => {
      test.each([
        [0, USER_FRIENDLY_ERROR_MESSAGES.UNEXPECTED_ERROR],
        [StatusCodes.MULTIPLE_CHOICES, USER_FRIENDLY_ERROR_MESSAGES.UNABLE_TO_PROCESS_RESPONSE],
        [StatusCodes.BAD_REQUEST, USER_FRIENDLY_ERROR_MESSAGES.DATA_VALIDATION_ERROR],
        [StatusCodes.UNAUTHORIZED, USER_FRIENDLY_ERROR_MESSAGES.AUTHENTICATION_FAILURE],
        [StatusCodes.FORBIDDEN, USER_FRIENDLY_ERROR_MESSAGES.PERMISSION_DENIED],
        [StatusCodes.NOT_FOUND, USER_FRIENDLY_ERROR_MESSAGES.RESOURCE_NOT_FOUND],
        [StatusCodes.REQUEST_TOO_LONG, USER_FRIENDLY_ERROR_MESSAGES.REQUEST_TOO_LONG],
        [StatusCodes.TOO_MANY_REQUESTS, USER_FRIENDLY_ERROR_MESSAGES.TOO_MANY_REQUESTS],
        [StatusCodes.INTERNAL_SERVER_ERROR, USER_FRIENDLY_ERROR_MESSAGES.UNEXPECTED_ERROR],
        [StatusCodes.BAD_GATEWAY, USER_FRIENDLY_ERROR_MESSAGES.SERVICE_UNAVAILABLE],
        [StatusCodes.SERVICE_UNAVAILABLE, USER_FRIENDLY_ERROR_MESSAGES.SERVICE_UNAVAILABLE],
      ])("%s Status Code", (statusCode, expectedMessage) => {
        // GIVEN an API ServiceError with the given error code
        const error = new ServiceError(
          "service",
          "function",
          "method",
          "path",
          statusCode,
          ErrorCodes.API_ERROR,
          "Failed to fetch models",
          "Failed to fetch models"
        );
        // WHEN calling getUserFriendlyErrorMessage
        const message = getUserFriendlyErrorMessage(error);
        // THEN the function should return the appropriate message
        expect(message).toBe(expectedMessage);
      });
    });

    test.each([
      [ErrorCodes.FAILED_TO_FETCH, USER_FRIENDLY_ERROR_MESSAGES.SERVER_CONNECTION_ERROR],
      [ErrorCodes.INVALID_RESPONSE_BODY, USER_FRIENDLY_ERROR_MESSAGES.UNABLE_TO_PROCESS_RESPONSE],
      [ErrorCodes.INVALID_RESPONSE_HEADER, USER_FRIENDLY_ERROR_MESSAGES.UNABLE_TO_PROCESS_RESPONSE],
      ["(none of the above)", USER_FRIENDLY_ERROR_MESSAGES.UNEXPECTED_ERROR],
    ])("Should return correct message for '%s' error code", (errorCode, errorMessage) => {
      // GIVEN a ServiceError with the given error code
      const error = new ServiceError(
        "service",
        "function",
        "method",
        "path",
        0,
        errorCode as ErrorCodes,
        "Failed to fetch models",
        "Failed to fetch models"
      );
      // WHEN calling getUserFriendlyErrorMessage
      const message = getUserFriendlyErrorMessage(error);
      // THEN the function should return the appropriate message
      expect(message).toBe(errorMessage);
    });
  });
});
