import * as ImportRequest from "../import";
import * as ModelInfo from "../modelInfo";

export interface IErrorResponse {
  errorCode: ErrorCodes | ImportRequest.Types.ImportResponseErrorCodes | ModelInfo.Types.POST.Response.ErrorCodes | ModelInfo.Types.GET.Response.ErrorCodes, // The UI could use to display some useful information
  message: string, // The error message offers better developer experience. UI should not display this message.
  details: string, // This may be some cryptic message only a developer can understand
}

export enum ErrorCodes {
  MALFORMED_BODY = "MALFORMED_BODY",
  METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE",
  TOO_LARGE_PAYLOAD = "TOO_LARGE_PAYLOAD",
  BAD_REQUEST = "BAD_REQUEST",
  INVALID_JSON_SCHEMA = "INVALID_JSON_SCHEMA"
}

export enum ReasonPhrases {
  MALFORMED_BODY = "Payload is malformed, it should be a valid model json",
  INTERNAL_SERVER_ERROR = "Internal Server Error",
  METHOD_NOT_ALLOWED = "Method Not Allowed",
  NOT_FOUND = "Not Found",
  UNSUPPORTED_MEDIA_TYPE = "Unsupported Media Type",
  TOO_LARGE_PAYLOAD = "Payload is too long",
  BAD_REQUEST = "Bad Request",
  INVALID_JSON_SCHEMA = "Invalid json schema"
}