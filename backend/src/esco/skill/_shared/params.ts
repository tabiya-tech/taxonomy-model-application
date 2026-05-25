import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, StatusCodes } from "server/httpUtils";
import { ajvInstance } from "validator";
import SkillAPISpecs from "api-specifications/esco/skill";
import { ValidateFunction } from "ajv";
import { pathToRegexp } from "path-to-regexp";
import ErrorAPISpecs from "api-specifications/error";

/**
 * Extracts and validates the modelId path parameter from the event.
 */
export function extractAndValidateModelIdParam(
  event: APIGatewayProxyEvent,
  route: string
): { modelId: string } | APIGatewayProxyResult {
  const pathToMatch = event.path || "";
  const execMatch = pathToRegexp(route).regexp.exec(pathToMatch);
  if (!execMatch) {
    return errorResponse(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      "Route did not match",
      ""
    );
  }
  const resolvedModelId = execMatch[1];

  const requestPathParameter: SkillAPISpecs.GET.Types.Request.Param.Payload = {
    modelId: resolvedModelId,
  };

  const validatePathFunction = ajvInstance.getSchema(
    SkillAPISpecs.GET.Schemas.Request.Param.Payload.$id as string
  ) as ValidateFunction<SkillAPISpecs.GET.Types.Request.Param.Payload>;

  const isValidPathParameter = validatePathFunction(requestPathParameter);
  if (!isValidPathParameter) {
    return errorResponse(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      JSON.stringify({
        reason: "Invalid modelId",
        path: event.path,
        pathParameters: event.pathParameters,
      })
    );
  }

  return { modelId: resolvedModelId };
}

/**
 * Extracts and validates the modelId and id path parameters from the event.
 */
export function extractAndValidateIdParams(
  event: APIGatewayProxyEvent,
  route: string
): { modelId: string; id: string } | APIGatewayProxyResult {
  const pathToMatch = event.path || "";
  const execMatch = pathToRegexp(route).regexp.exec(pathToMatch);
  if (!execMatch) {
    return errorResponse(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      "Route did not match",
      ""
    );
  }
  const resolvedModelId = execMatch[1];
  const resolvedId = execMatch[2];

  const requestPathParameter: SkillAPISpecs.Skill.GET.Types.Request.Param.Payload = {
    modelId: resolvedModelId,
    id: resolvedId,
  };

  const validatePathFunction = ajvInstance.getSchema(
    SkillAPISpecs.Skill.GET.Schemas.Request.Param.Payload.$id as string
  ) as ValidateFunction<SkillAPISpecs.Skill.GET.Types.Request.Param.Payload>;

  const isValidPathParameter = validatePathFunction(requestPathParameter);
  if (!isValidPathParameter) {
    return errorResponse(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      JSON.stringify({
        reason: "Invalid modelId or skill id",
        path: event.path,
        pathParameters: event.pathParameters,
      })
    );
  }

  return { modelId: resolvedModelId, id: resolvedId };
}
