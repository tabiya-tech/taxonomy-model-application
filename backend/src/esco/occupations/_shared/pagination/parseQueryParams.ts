import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, StatusCodes } from "server/httpUtils";
import { ajvInstance } from "validator";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { ValidateFunction } from "ajv";
import ErrorAPISpecs from "api-specifications/error";
import { decodeCursor } from "./decodeCursor";

/**
 * Parses and validates the pagination query parameters (limit and cursor) from the event.
 * @param event The API Gateway proxy event.
 * @returns { limit: number; decodedCursor: string | undefined } on success, or an APIGatewayProxyResult error response on failure.
 */
export function parsePaginationQueryParams(
  event: APIGatewayProxyEvent
): { limit: number; decodedCursor: string | undefined } | APIGatewayProxyResult {
  const rawQueryParams = event.queryStringParameters || {};
  const queryParams: OccupationAPISpecs.GET.Types.Request.Query.Payload = {
    limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
    cursor: rawQueryParams.cursor ?? undefined,
  };

  const validateQueryFunction = ajvInstance.getSchema(
    OccupationAPISpecs.GET.Schemas.Request.Query.Payload.$id as string
  ) as ValidateFunction<OccupationAPISpecs.GET.Types.Request.Query.Payload>;

  const isQueryValid = validateQueryFunction(queryParams);
  if (!isQueryValid) {
    return errorResponseGET(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
      ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      JSON.stringify({ reason: "Invalid query parameters", path: event.path, query: event.queryStringParameters })
    );
  }

  let limit = OccupationAPISpecs.Constants.DEFAULT_LIMIT;
  if (queryParams.limit) {
    limit = queryParams.limit;
  }

  let decodedCursorId: string | undefined = undefined;
  if (queryParams.cursor) {
    try {
      decodedCursorId = decodeCursor(queryParams.cursor).id;
    } catch (e: unknown) {
      return errorResponseGET(
        StatusCodes.BAD_REQUEST,
        ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
        "Invalid cursor parameter",
        ""
      );
    }
  }

  return { limit, decodedCursor: decodedCursorId };
}
