import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { STD_ERRORS_RESPONSES } from "server/httpUtils";
import { ajvInstance, ParseValidationError } from "validator";

export function parseAndValidatePATCHRequest(
  event: APIGatewayProxyEvent
): OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Request.Payload | APIGatewayProxyResult {
  const contentType = event.headers?.["Content-Type"] ?? event.headers?.["content-type"];
  if (!contentType?.includes("application/json")) {
    return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
  }

  if (event.body == null) {
    return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR("Body is empty");
  }

  if (event.body.length > OccupationGroupAPISpecs.OccupationGroup.PATCH.Constants.MAX_PATCH_PAYLOAD_LENGTH) {
    return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
      `Expected maximum length is ${OccupationGroupAPISpecs.OccupationGroup.PATCH.Constants.MAX_PATCH_PAYLOAD_LENGTH}`
    );
  }

  let payload: OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Request.Payload;
  try {
    payload = JSON.parse(event.body);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(errorMessage);
  }

  const validateFunction = ajvInstance.getSchema(
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload.$id as string
  ) as ValidateFunction | undefined;

  if (!validateFunction) {
    console.error("AJV schema not found for PATCH OccupationGroup request payload");
    return STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR;
  }

  const isValid = validateFunction(payload);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
  }

  return payload;
}
