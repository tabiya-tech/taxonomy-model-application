namespace ErrorConstants {
  export enum ErrorCodes {
    MALFORMED_BODY = "MALFORMED_BODY",
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
    NOT_FOUND = "NOT_FOUND",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE",
    TOO_LARGE_PAYLOAD = "TOO_LARGE_PAYLOAD",
    BAD_REQUEST = "BAD_REQUEST",
    INVALID_JSON_SCHEMA = "INVALID_JSON_SCHEMA",
  }

  export enum ReasonPhrases {
    MALFORMED_BODY = "Payload is malformed, it should be a valid model json",
    INTERNAL_SERVER_ERROR = "Internal Server Error",
    METHOD_NOT_ALLOWED = "Method Not Allowed",
    NOT_FOUND = "Not Found",
    UNSUPPORTED_MEDIA_TYPE = "Unsupported Media Type",
    TOO_LARGE_PAYLOAD = "Payload is too long",
    BAD_REQUEST = "Bad Request",
    INVALID_JSON_SCHEMA = "Invalid json schema",
  }
}
export default ErrorConstants;
