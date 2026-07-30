import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import ErrorAPISpecs from "api-specifications/error";
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
  CONFLICT = 409,
  TOO_LARGE_PAYLOAD = 413,
  UNSUPPORTED_MEDIA_TYPE = 415,
  INTERNAL_SERVER_ERROR = 500,
}

// Resolved per-invocation by setRequestOrigin() in the top-level handler before any response is built.
let _currentRequestOrigin: string | undefined;

export function setRequestOrigin(origin: string | undefined): void {
  _currentRequestOrigin = origin;
}

function resolveAllowedOrigin(): string {
  if (process.env.TARGET_ENVIRONMENT === "dev") return "*";

  // No environment set — likely module init time or test context, skip CORS entirely.
  if (!process.env.TARGET_ENVIRONMENT) return "";

  const allowedOrigins = (process.env.EXTRA_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    console.warn(
      `No EXTRA_ALLOWED_ORIGINS set for environment ${process.env.TARGET_ENVIRONMENT}; CORS requests will be denied.`
    );
    return "";
  }

  if (_currentRequestOrigin && allowedOrigins.includes(_currentRequestOrigin)) {
    return _currentRequestOrigin;
  }

  // Request origin is not in the allowed list — omit the CORS header so the browser blocks it.
  if (_currentRequestOrigin) {
    console.warn(
      `Origin ${_currentRequestOrigin} is not in the allowed list for environment ${process.env.TARGET_ENVIRONMENT}; CORS requests will be denied.`
    );
  }
  return "";
}

// See https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
// For the format of the return value
export function response(
  statusCode: StatusCodes,
  body: object | string | null,
  headers?: {
    [key: string]: string;
  }
): APIGatewayProxyResult {
  const corsOrigin = resolveAllowedOrigin();

  return {
    isBase64Encoded: false,
    headers: {
      ...(headers ?? {}),
      ...(corsOrigin && { "Access-Control-Allow-Origin": corsOrigin }),
    },
    multiValueHeaders: {},
    statusCode: statusCode,
    body: typeof body === "object" ? JSON.stringify(body) : body,
  };
}

export function responseJSON(statusCode: StatusCodes, body: object | string | null): APIGatewayProxyResult {
  return response(statusCode, body, { "Content-Type": "application/json" });
}

function _errorResponse(statusCode: StatusCodes, error: ErrorAPISpecs.Types.Payload): APIGatewayProxyResult {
  return response(statusCode, error);
}

function _errorResponsePOST(statusCode: StatusCodes, error: ErrorAPISpecs.Types.POST): APIGatewayProxyResult {
  return response(statusCode, error);
}
function _errorResponseGET(statusCode: StatusCodes, error: ErrorAPISpecs.Types.GET): APIGatewayProxyResult {
  return response(statusCode, error);
}

function _errorResponsePATCH(statusCode: StatusCodes, error: ErrorAPISpecs.Types.PATCH): APIGatewayProxyResult {
  return response(statusCode, error);
}

export function errorResponsePOST(
  statusCode: StatusCodes,
  errorCode: ErrorAPISpecs.Types.POST["errorCode"],
  message: string,
  details: string
): APIGatewayProxyResult {
  return _errorResponsePOST(statusCode, {
    errorCode: errorCode,
    message: message ?? "",
    details: details ?? "",
  });
}

export function errorResponseGET(
  statusCode: StatusCodes,
  errorCode: ErrorAPISpecs.Types.GET["errorCode"],
  message: string,
  details: string
): APIGatewayProxyResult {
  return _errorResponseGET(statusCode, {
    errorCode: errorCode,
    message: message ?? "",
    details: details ?? "",
  });
}

export function errorResponsePATCH(
  statusCode: StatusCodes,
  errorCode: ErrorAPISpecs.Types.PATCH["errorCode"],
  message: string,
  details: string
): APIGatewayProxyResult {
  return _errorResponsePATCH(statusCode, {
    errorCode: errorCode,
    message: message ?? "",
    details: details ?? "",
  });
}

export function errorResponse(
  statusCode: StatusCodes,
  errorCode: ErrorAPISpecs.Types.Payload["errorCode"],
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
