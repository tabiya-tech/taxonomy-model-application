import { ErrorCodes } from "./errorCodes";
import { getServiceErrorFactory, ServiceError } from "./error";

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
