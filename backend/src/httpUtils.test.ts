import {
  errorResponse,
  errorsResponse,
  response,
  ResponseError,
  STD_ERRORS_RESPONSES
} from "./httpUtils";

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
    const givenError: ResponseError = {
      error: "error",
      message: "message",
      details: "details",
      path: "path",
    };

    //WHEN errorResponse is invoked for the given status and error
    const result = errorResponse(givenStatusCode, givenError.error, givenError.message, givenError.details, givenError.path);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains given error
    expect(result.body).toEqual(JSON.stringify([givenError]));
  });
});

describe("test the errorsResponse function", () => {
  test("should return correct response for multiple errors", () => {
    // GIVEN a status code
    const givenStatusCode = 500;
    // AND multiple errors details
    const givenErrors: ResponseError[] = [{
      error: "error1",
      message: "message1",
      details: "details1",
      path: "path1",
    }, {
      error: "error2",
      message: "message2",
      details: "details2",
      path: "path2",
    }];

    //WHEN errorsResponse is invoked for the given status and errors
    const result = errorsResponse(givenStatusCode, givenErrors);

    //THEN expect statusCode to be
    expect(result.statusCode).toEqual(givenStatusCode);
    // AND body to be a json string of an array than contains the given errors
    expect(result.body).toEqual(JSON.stringify(givenErrors));
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
