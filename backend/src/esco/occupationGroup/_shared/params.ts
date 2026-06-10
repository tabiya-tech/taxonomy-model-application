import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, StatusCodes } from "server/httpUtils";
import { ajvInstance } from "validator";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { ValidateFunction } from "ajv";
import { pathToRegexp } from "path-to-regexp";
import ErrorAPISpecs from "api-specifications/error";
/**
 * Extracts and validates the modelId and id path parameters from the event.
 * @param event The API Gateway proxy event.
 * @param route The route pattern to match against the event path.
 * @returns { modelId: string; id: string } on success, or an APIGatewayProxyResult error response on failure.
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

  const requestPathParameter: OccupationGroupAPISpecs.OccupationGroup.Types.Param.Payload = {
    modelId: resolvedModelId,
    id: resolvedId,
  };

  const validatePathFunction = ajvInstance.getSchema(
    OccupationGroupAPISpecs.GET.Schemas.Request.Param.Payload.$id as string
  ) as ValidateFunction<OccupationGroupAPISpecs.OccupationGroup.Types.Param.Payload>;

  const isValidPathParameter = validatePathFunction(requestPathParameter);
  if (!isValidPathParameter) {
    return errorResponse(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
      ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      JSON.stringify({
        reason: "Invalid modelId or occupation Id",
        path: event.path,
        pathParameters: event.pathParameters,
      })
    );
  }

  return { modelId: resolvedModelId, id: resolvedId };
}
