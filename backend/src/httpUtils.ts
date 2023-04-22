import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";

export enum HTTP_VERBS {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
}

export enum ReasonPhrases {
  INTERNAL_SERVER_ERROR = "Internal Server Error",
  METHOD_NOT_ALLOWED = "Method Not Allowed",
  NOT_FOUND = "Not Found"
}

export enum StatusCodes {
  INTERNAL_SERVER_ERROR = 500,
  METHOD_NOT_ALLOWED = 405,
  NOT_FOUND = 404,
  OK = 200,
}

export enum ErrorCodes {
  METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

// See https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
// For the format of the return value
export function response(statusCode: StatusCodes, body: object | string): APIGatewayProxyResult {
  return {
    isBase64Encoded: false,
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    },
    multiValueHeaders: {},
    statusCode: statusCode,
    body: (typeof body === "object" ? JSON.stringify(body) : body)
  }
}

export type ResponseError = {
  error: string, // This is what the UI should use to display some useful information
  message: string, // the error message offers better developer experience. UI should not display this message.
  details: string, // this may be some cryptic message only useful to a developer
  path: string // this is the path to the resource, if it exists
};

export function errorResponse(statusCode: StatusCodes, error: string, message: string, details: string, path: string): APIGatewayProxyResult {
  return response(statusCode, [{
    error: error,
    message: message,
    details: details,
    path: path
  }]);
}

export function errorsResponse(statusCode: StatusCodes, errors: ResponseError[]): APIGatewayProxyResult {
  return response(statusCode, errors);
}

// Standard error responses used repeatedly
export const STD_ERRORS_RESPONSES = {
  METHOD_NOT_ALLOWED: errorResponse(StatusCodes.METHOD_NOT_ALLOWED, ErrorCodes.METHOD_NOT_ALLOWED, ReasonPhrases.METHOD_NOT_ALLOWED, "", ""),
  NOT_FOUND: errorResponse(StatusCodes.NOT_FOUND, ErrorCodes.NOT_FOUND, ReasonPhrases.NOT_FOUND, "", ""),
  INTERNAL_SERVER_ERROR: errorResponse(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_SERVER_ERROR, ReasonPhrases.INTERNAL_SERVER_ERROR, "", ""),
}