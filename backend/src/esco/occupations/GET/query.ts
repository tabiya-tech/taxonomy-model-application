import mongoose from "mongoose";
import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { ValidateFunction } from "ajv";
import { ajvInstance } from "validator";
import { errorResponseGET, StatusCodes } from "server/httpUtils";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import ErrorAPISpecs from "api-specifications/error";
import { EmbeddableField } from "embeddings/service/types";
import { decodeCursor } from "../_shared/pagination/decodeCursor";
import { decodeSearchCursor } from "esco/common/searchCursor";

/**
 * Checks that a cursor token is well-formed for one of the two pagination strategies this endpoint uses:
 * a keyset cursor (plain list / regex search) or a relevance-offset cursor (vector search). The two encodings
 * are distinguishable — a keyset payload has a valid ObjectId `id`, while a search payload holds a non-negative
 * integer `offset` — so a valid token of either kind is accepted and anything else is rejected.
 */
function isWellFormedCursor(cursor: string): boolean {
  try {
    const keyset = decodeCursor(cursor);
    if (mongoose.Types.ObjectId.isValid(keyset.id)) {
      return true;
    }
  } catch {
    // Not a keyset cursor; fall through and try to interpret it as a search cursor.
  }

  try {
    decodeSearchCursor(cursor);
    return true;
  } catch {
    return false;
  }
}

/**
 * The successfully parsed and validated GET /occupations query parameters.
 */
export interface IParsedOccupationGETQuery {
  limit: number;
  // The free-text search value, present only when the request asked to search.
  searchValue?: string;
  // The fields to search on; defaults to [preferredLabel]. Only meaningful together with searchValue.
  searchFields: EmbeddableField[];
}

/**
 * Parses and validates the GET /occupations query parameters (pagination + optional search).
 * @param event The API Gateway proxy event.
 * @returns The parsed query on success, or an APIGatewayProxyResult error response on failure.
 */
export function parseGETQuery(event: APIGatewayProxyEvent): IParsedOccupationGETQuery | APIGatewayProxyResult {
  const rawQueryParams = event.queryStringParameters || {};
  const queryParams: OccupationAPISpecs.GET.Types.Request.Query.Payload = {
    limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
    cursor: rawQueryParams.cursor ?? undefined,
    query: rawQueryParams.query ?? undefined,
    searchFields: rawQueryParams.searchFields ?? undefined,
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

  // Validate that the cursor is a well-formed (base64 JSON) token of one of the two supported kinds (keyset or
  // relevance offset). The exact semantics depend on the search strategy and are interpreted downstream, but a
  // token that is neither kind is a bad request.
  if (queryParams.cursor && !isWellFormedCursor(queryParams.cursor)) {
    return errorResponseGET(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
      "Invalid cursor parameter",
      ""
    );
  }

  // searchFields defaults to preferredLabel. The schema has already validated that, when present, it is a
  // comma-separated list of known searchable field names, so the split values map cleanly to EmbeddableField.
  const searchFields: EmbeddableField[] = queryParams.searchFields
    ? (queryParams.searchFields.split(",") as EmbeddableField[])
    : [EmbeddableField.preferredLabel];

  return {
    limit,
    searchValue: queryParams.query,
    searchFields,
  };
}
