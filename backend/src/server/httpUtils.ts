import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import ErrorAPISpecs from "api-specifications/error";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import ImportAPISpecs from "api-specifications/import";

export enum HTTP_VERBS {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  OPTIONS = "OPTIONS",
}

export enum StatusCodes {
  INTERNAL_SERVER_ERROR = 500,
  BAD_REQUEST = 400,
  METHOD_NOT_ALLOWED = 405,
  NOT_FOUND = 404,
  UNSUPPORTED_MEDIA_TYPE = 415,
  TOO_LARGE_PAYLOAD = 413,
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
}

// See https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
// For the format of the return value
export function response(
  statusCode: StatusCodes,
  body: object | string,
  headers?: {
    [key: string]: string;
  }
): APIGatewayProxyResult {
  return {
    isBase64Encoded: false,
    headers: {
      ...(headers ?? {}),
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    },
    multiValueHeaders: {},
    statusCode: statusCode,
    body: typeof body === "object" ? JSON.stringify(body) : body,
  };
}

export function responseJSON(statusCode: StatusCodes, body: object | string): APIGatewayProxyResult {
  return response(statusCode, body, { "Content-Type": "application/json" });
}

function _errorResponse(statusCode: StatusCodes, error: ErrorAPISpecs.Types.Payload): APIGatewayProxyResult {
  return response(statusCode, error);
}

export function errorResponse(
  statusCode: StatusCodes,
  errorCode:
    | ErrorAPISpecs.Constants.ErrorCodes
    | ImportAPISpecs.Enums.POST.Response.ImportResponseErrorCodes
    | ModelInfoAPISpecs.Enums.POST.Response.ErrorCodes
    | ModelInfoAPISpecs.Enums.GET.Response.ErrorCodes,
  message: string,
  details: string
): APIGatewayProxyResult {
  return _errorResponse(statusCode, {
    errorCode: errorCode,
    message: message ?? "",
    details: details ?? "",
  });
}

// Standard error responses used repeatedly
export const STD_ERRORS_RESPONSES = {
  METHOD_NOT_ALLOWED: errorResponse(
    StatusCodes.METHOD_NOT_ALLOWED,
    ErrorAPISpecs.Constants.ErrorCodes.METHOD_NOT_ALLOWED,
    ErrorAPISpecs.Constants.ReasonPhrases.METHOD_NOT_ALLOWED,
    ""
  ),
  NOT_FOUND: errorResponse(
    StatusCodes.NOT_FOUND,
    ErrorAPISpecs.Constants.ErrorCodes.NOT_FOUND,
    ErrorAPISpecs.Constants.ReasonPhrases.NOT_FOUND,
    ""
  ),
  INTERNAL_SERVER_ERROR: errorResponse(
    StatusCodes.INTERNAL_SERVER_ERROR,
    ErrorAPISpecs.Constants.ErrorCodes.INTERNAL_SERVER_ERROR,
    ErrorAPISpecs.Constants.ReasonPhrases.INTERNAL_SERVER_ERROR,
    ""
  ),
  MALFORMED_BODY_ERROR: (errorDetails: string) =>
    errorResponse(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY,
      ErrorAPISpecs.Constants.ReasonPhrases.MALFORMED_BODY,
      errorDetails
    ),
  INVALID_JSON_SCHEMA_ERROR: (errorDetails: string) =>
    errorResponse(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      errorDetails
    ),
  UNSUPPORTED_MEDIA_TYPE_ERROR: errorResponse(
    StatusCodes.UNSUPPORTED_MEDIA_TYPE,
    ErrorAPISpecs.Constants.ErrorCodes.UNSUPPORTED_MEDIA_TYPE,
    ErrorAPISpecs.Constants.ReasonPhrases.UNSUPPORTED_MEDIA_TYPE,
    "Content-Type should be application/json"
  ),
  TOO_LARGE_PAYLOAD_ERROR: (errorDetails: string) =>
    errorResponse(
      StatusCodes.TOO_LARGE_PAYLOAD,
      ErrorAPISpecs.Constants.ErrorCodes.TOO_LARGE_PAYLOAD,
      ErrorAPISpecs.Constants.ReasonPhrases.TOO_LARGE_PAYLOAD,
      errorDetails
    ),
};

export function redactCredentialsFromURI(uri: string) {
  // Regular expression pattern to match username and password
  const pattern = /\/\/[^@]+@/;

  // Replace the matched username and password with asterisks
  return uri.replace(pattern, "//*:*@");
}
