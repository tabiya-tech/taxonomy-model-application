namespace ErrorConstants {
  export namespace Common {
    export enum ErrorCodes {
      INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
      METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
      NOT_FOUND = "NOT_FOUND",
      UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE",
      BAD_REQUEST = "BAD_REQUEST",
      FORBIDDEN = "FORBIDDEN",
    }
  }
  export namespace POST {
    export enum ErrorCodes {
      MALFORMED_BODY = "MALFORMED_BODY",
      TOO_LARGE_PAYLOAD = "TOO_LARGE_PAYLOAD",
      INVALID_JSON_SCHEMA = "INVALID_JSON_SCHEMA",
    }
  }
  export namespace GET {
    export enum ErrorCodes {
      INVALID_QUERY_PARAMETER = "INVALID_QUERY_PARAMETER",
    }
  }

  export namespace PATCH {
    export enum ErrorCodes {
      MALFORMED_BODY = "MALFORMED_BODY",
      TOO_LARGE_PAYLOAD = "TOO_LARGE_PAYLOAD",
      INVALID_JSON_SCHEMA = "INVALID_JSON_SCHEMA",
    }
  }

  export enum ErrorCodes {
    MALFORMED_BODY = "MALFORMED_BODY",
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
    NOT_FOUND = "NOT_FOUND",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE",
    TOO_LARGE_PAYLOAD = "TOO_LARGE_PAYLOAD",
    BAD_REQUEST = "BAD_REQUEST",
    INVALID_JSON_SCHEMA = "INVALID_JSON_SCHEMA",
    FORBIDDEN = "FORBIDDEN",
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
    FORBIDDEN = "Forbidden",
  }

  export const MAX_DETAILS_LENGTH = 4000;
  export const MAX_MESSAGE_LENGTH = 256;
}
export default ErrorConstants;
