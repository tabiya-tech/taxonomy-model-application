import mongoose from "mongoose";
import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { ValidateFunction } from "ajv";
import { ajvInstance } from "validator";
import { errorResponseGET, StatusCodes } from "server/httpUtils";
import SkillAPISpecs from "api-specifications/esco/skill";
import ErrorAPISpecs from "api-specifications/error";
import { EmbeddableField } from "embeddings/service/types";
import { decodeCursor } from "../../occupations/_shared/pagination/decodeCursor";
import { decodeSearchCursor } from "esco/common/searchCursor";

/**
 * Checks that a cursor token is well-formed for one of the two pagination strategies this endpoint uses:
 * a keyset cursor (plain list / regex search) or a relevance-offset cursor (vector search). The two encodings
 * are distinguishable — a keyset payload has a valid ObjectId `id` and `createdAt`, while a search payload holds
 * a non-negative integer `offset` — so a valid token of either kind is accepted and anything else is rejected.
 *
 * This must accept both kinds: validating only as a keyset cursor would silently misread a search cursor as a
 * malformed keyset one (`{id: undefined, createdAt: Invalid Date}`), which downstream is dropped rather than
 * erroring, causing pagination to repeat the first page.
 */
function isWellFormedCursor(cursor: string): boolean {
  try {
    const keyset = decodeCursor(cursor);
    if (mongoose.Types.ObjectId.isValid(keyset.id) && !Number.isNaN(keyset.createdAt.getTime())) {
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
 * The successfully parsed and validated GET /skills query parameters.
 */
export interface IParsedSkillGETQuery {
  limit: number;
  // The free-text search value, present only when the request asked to search.
  searchValue?: string;
  // The fields to search on; defaults to [preferredLabel]. Only meaningful together with searchValue.
  searchFields: EmbeddableField[];
}

/**
 * Parses and validates the GET /skills query parameters (pagination + optional search).
 * @param event The API Gateway proxy event.
 * @returns The parsed query on success, or an APIGatewayProxyResult error response on failure.
 */
export function parseGETQuery(event: APIGatewayProxyEvent): IParsedSkillGETQuery | APIGatewayProxyResult {
  const rawQueryParams = event.queryStringParameters || {};
  const queryParams: SkillAPISpecs.GET.Types.Request.Query.Payload = {
    limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
    cursor: rawQueryParams.cursor ?? undefined,
    query: rawQueryParams.query ?? undefined,
    searchFields: rawQueryParams.searchFields ?? undefined,
  };

  const validateQueryFunction = ajvInstance.getSchema(
    SkillAPISpecs.GET.Schemas.Request.Query.Payload.$id as string
  ) as ValidateFunction<SkillAPISpecs.GET.Types.Request.Query.Payload>;

  const isQueryValid = validateQueryFunction(queryParams);
  if (!isQueryValid) {
    return errorResponseGET(
      StatusCodes.BAD_REQUEST,
      ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
      ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
      JSON.stringify({ reason: "Invalid query parameters", path: event.path, query: event.queryStringParameters })
    );
  }

  let limit = SkillAPISpecs.Constants.DEFAULT_LIMIT;
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
