import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, StatusCodes } from "server/httpUtils";
import { ajvInstance } from "validator";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { ValidateFunction } from "ajv";
import { pathToRegexp } from "path-to-regexp";
import ErrorAPISpecs from "api-specifications/error";

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

  const requestPathParameter: SkillGroupAPISpecs.SkillGroup.Types.Param.Payload = {
    modelId: resolvedModelId,
    id: resolvedId,
  };

  const validatePathFunction = ajvInstance.getSchema(
    SkillGroupAPISpecs.GET.Schemas.Request.Param.Payload.$id as string
  ) as ValidateFunction<SkillGroupAPISpecs.SkillGroup.Types.Param.Payload>;

  const isValidPathParameter = validatePathFunction(requestPathParameter);
  if (!isValidPathParameter) {
    return errorResponse(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      JSON.stringify({
        reason: "Invalid modelId or skillGroup Id",
        path: event.path,
        pathParameters: event.pathParameters,
      })
    );
  }

  return { modelId: resolvedModelId, id: resolvedId };
}
