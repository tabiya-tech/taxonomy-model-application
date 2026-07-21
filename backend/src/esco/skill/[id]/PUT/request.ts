import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { STD_ERRORS_RESPONSES } from "server/httpUtils";
import { ajvInstance, ParseValidationError } from "validator";
import { ValidateFunction } from "ajv";
import SkillAPISpecs from "api-specifications/esco/skill";

export function parseAndValidatePUTRequest(
  event: APIGatewayProxyEvent
): SkillAPISpecs.Skill.PUT.Types.Request.Payload | APIGatewayProxyResult {
  const contentType = event.headers?.["Content-Type"] ?? event.headers?.["content-type"];
  if (!contentType?.includes("application/json")) {
    return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
  }

  if (event.body == null) {
    return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR("Body is empty");
  }

  if (event.body.length > SkillAPISpecs.Skill.PUT.Constants.MAX_PUT_PAYLOAD_LENGTH) {
    return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
      `Expected maximum length is ${SkillAPISpecs.Skill.PUT.Constants.MAX_PUT_PAYLOAD_LENGTH}`
    );
  }

  let payload: SkillAPISpecs.Skill.PUT.Types.Request.Payload;
  try {
    payload = JSON.parse(event.body);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(errorMessage);
  }

  const validateFunction = ajvInstance.getSchema(SkillAPISpecs.Skill.PUT.Schemas.Request.Payload.$id as string) as
    | ValidateFunction
    | undefined;

  if (!validateFunction) {
    console.error("AJV schema not found for PUT Skill request payload");
    return STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR;
  }

  const isValid = validateFunction(payload);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
  }

  return payload;
}
