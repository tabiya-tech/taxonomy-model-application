import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import ErrorAPISpecs from "api-specifications/error";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import ImportAPISpecs from "api-specifications/import";
import ExportAPISpecs from "api-specifications/export";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import process from "process";

export enum HTTP_VERBS {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  OPTIONS = "OPTIONS",
}

export enum StatusCodes {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  PARTIAL_CONTENT = 206,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  TOO_LARGE_PAYLOAD = 413,
  UNSUPPORTED_MEDIA_TYPE = 415,
  INTERNAL_SERVER_ERROR = 500,
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
  let allowedOrigins = "";
  if (process.env.TARGET_ENVIRONMENT === "dev") {
    allowedOrigins = "*"; // Allow all origins in development
  } else if (process.env.DOMAIN_NAME) {
    allowedOrigins = process.env.DOMAIN_NAME; // Use DOMAIN_NAME if set
  } else {
    // If DOMAIN_NAME is not set, we intentionally omit the CORS header
    console.warn(`No DOMAIN_NAME set for environment ${process.env.TARGET_ENVIRONMENT}; CORS requests will be denied.`);
  }

  return {
    isBase64Encoded: false,
    headers: {
      ...(headers ?? {}),
      ...(allowedOrigins && { "Access-Control-Allow-Origin": allowedOrigins }), // Conditionally add the CORS header if allowedOrigins is not empty
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
    | ExportAPISpecs.Enums.POST.Response.ExportResponseErrorCodes
    | ModelInfoAPISpecs.Enums.POST.Response.ErrorCodes
    | OccupationGroupAPISpecs.Enums.POST.Response.ErrorCodes
    | OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes
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
  FORBIDDEN: errorResponse(
    StatusCodes.FORBIDDEN,
    ErrorAPISpecs.Constants.ErrorCodes.FORBIDDEN,
    ErrorAPISpecs.Constants.ReasonPhrases.FORBIDDEN,
    ""
  ),
};
