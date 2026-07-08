import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { STD_ERRORS_RESPONSES } from "server/httpUtils";
import { ajvInstance, ParseValidationError } from "validator";
import { ValidateFunction } from "ajv";
import OccupationAPISpecs from "api-specifications/esco/occupation";

export function parseAndValidatePUTRequest(
  event: APIGatewayProxyEvent
): OccupationAPISpecs.Occupation.PUT.Types.Request.Payload | APIGatewayProxyResult {
  if (!event.headers?.["Content-Type"]?.includes("application/json")) {
    return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
  }

  if (event.body == null) {
    return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR("Body is empty");
  }

  if (event.body.length > OccupationAPISpecs.Occupation.PUT.Constants.MAX_PUT_PAYLOAD_LENGTH) {
    return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
      `Expected maximum length is ${OccupationAPISpecs.Occupation.PUT.Constants.MAX_PUT_PAYLOAD_LENGTH}`
    );
  }

  let payload: OccupationAPISpecs.Occupation.PUT.Types.Request.Payload;
  try {
    payload = JSON.parse(event.body);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(errorMessage);
  }

  const validateFunction = ajvInstance.getSchema(
    OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload.$id as string
  ) as ValidateFunction;

  const isValid = validateFunction(payload);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
  }

  return payload;
}
