import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SchemaObject, ValidateFunction } from "ajv";
import { ajvInstance, ParseValidationError } from "validator";
import { STD_ERRORS_RESPONSES } from "server/httpUtils";

/**
 * The result of validating a request: either the typed, validated payload,
 * or the error response that the handler should return to the caller.
 */
export type RequestValidationResult<T> =
  | { payload: T; errorResponse?: never }
  | { payload?: never; errorResponse: APIGatewayProxyResult };

/**
 * Validates a payload against the given JSON schema.
 *
 * @param schema - The JSON schema to validate against. If it is already registered in the ajv instance it is reused, otherwise it is compiled.
 * @param payload - The payload to validate.
 * @return The typed payload when it is valid, otherwise the INVALID_JSON_SCHEMA error response to return to the caller.
 */
export function validateSchema<T>(schema: SchemaObject, payload: unknown): RequestValidationResult<T> {
  const validateFunction = (ajvInstance.getSchema(schema.$id as string) ??
    ajvInstance.compile(schema)) as ValidateFunction;
  const isValid = validateFunction(payload);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    return { errorResponse: STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail) };
  }
  return { payload: payload as T };
}

/**
 * Validates a JSON request event: the content type, the payload length, that the body is valid JSON,
 * and that it conforms to the given JSON schema.
 *
 * @param event - The API Gateway event to validate.
 * @param schema - The JSON schema the body must conform to.
 * @param maxPayloadLength - The maximum allowed length of the body.
 * @return The parsed and validated payload, otherwise the error response to return to the caller.
 */
export function validateEvent<T>(
  event: APIGatewayProxyEvent,
  schema: SchemaObject,
  maxPayloadLength: number
): RequestValidationResult<T> {
  if (!event.headers["Content-Type"]?.includes("application/json")) {
    return { errorResponse: STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR };
  }

  if (event.body?.length && event.body.length > maxPayloadLength) {
    return {
      errorResponse: STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(`Expected maximum length is ${maxPayloadLength}`),
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(event.body as string);
  } catch (error: unknown) {
    return { errorResponse: STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR((error as Error).message) };
  }

  return validateSchema<T>(schema, payload);
}
