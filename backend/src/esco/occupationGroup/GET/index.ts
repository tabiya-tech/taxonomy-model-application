import mongoose from "mongoose";
import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import ErrorAPISpecs from "api-specifications/error";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import OccupationGroupGETAPISpecs from "api-specifications/esco/occupationGroup/GET";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance } from "validator";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ModelForOccupationGroupValidationErrorCode } from "../_shared/OccupationGroup.types";
import { IOccupationGroupService } from "../services/occupationGroup.service.type";
import { decodeCursor, encodeCursor, getOccupationGroupsPathParameters } from "./query";
import { transformPaginated } from "./response";
import { parseBooleanQueryParam } from "common/formatters/parseBooleanQueryParam";
import { EmbeddableField } from "embeddings/service/types";
import { decodeSearchCursor } from "esco/common/searchCursor";

/**
 * Checks that a cursor token is well-formed for one of the two search pagination strategies: a keyset cursor
 * (regex search) or a relevance-offset cursor (vector search). A keyset payload has a valid ObjectId `id`, while a
 * search payload holds a non-negative integer `offset`, so a valid token of either kind is accepted and anything
 * else is rejected.
 */
function isWellFormedSearchCursor(cursor: string): boolean {
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

export class OccupationGroupListController {
  private readonly occupationGroupService: IOccupationGroupService;

  constructor() {
    this.occupationGroupService = getServiceRegistry().occupationGroup;
  }

  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups:
   *   get:
   *    operationId: GETOccupationGroups
   *    tags:
   *      - occupationGroups
   *    summary: Get a list of paginated occupation groups and cursor if there is one in a taxonomy model.
   *    description: Retrieve a list of paginated occupation groups in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestParamSchemaGET/properties/modelId'
   *      - in: query
   *        name: limit
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestQueryParamSchemaGET/properties/limit'
   *      - in: query
   *        name: cursor
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestQueryParamSchemaGET/properties/cursor'
   *      - in: query
   *        name: query
   *        required: false
   *        description: >
   *          A free-text value to search the occupation groups by. When set, the endpoint returns the occupation
   *          groups matching the value on the requested searchFields, ranked by relevance. Released models are
   *          searched with vector embeddings; unreleased models with a case-insensitive regex.
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestQueryParamSchemaGET/properties/query'
   *      - in: query
   *        name: searchFields
   *        required: false
   *        description: >
   *          A comma-separated list of the occupation group fields to search on (e.g. 'preferredLabel,description').
   *          Only meaningful together with query. Defaults to 'preferredLabel'.
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestQueryParamSchemaGET/properties/searchFields'
   *      - in: query
   *        name: root
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestQueryParamSchemaGET/properties/root'
   *    responses:
   *      '200':
   *        description: Successfully retrieved the paginated occupation groups.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OccupationGroupResponseSchemaGET'
   *      '400':
   *        description: |
   *          Failed to retrieve the occupation groups. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupationGroup400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Occupation groups not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupationGroups404ErrorSchema'
   *      '500':
   *        description: |
   *          The server encountered an unexpected condition.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/All500ResponseSchema'
   *
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getOccupationGroups(event: APIGatewayProxyEvent) {
    try {
      const { modelId: resolvedModelId } = getOccupationGroupsPathParameters(event.path);
      if (!resolvedModelId) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          OccupationGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "modelId is missing in the path",
          JSON.stringify({ path: event.path, pathParameters: event.pathParameters, query: event.queryStringParameters })
        );
      }

      const requestPathParameter: OccupationGroupAPISpecs.GET.Types.Request.Param.Payload = {
        modelId: resolvedModelId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.GET.Types.Request.Param.Payload>;

      const isValid = validatePathFunction(requestPathParameter);
      if (!isValid) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid modelId", path: event.path, pathParameters: event.pathParameters })
        );
      }

      const validationResult = await this.occupationGroupService.validateModelForOccupationGroup(
        requestPathParameter.modelId
      );
      if (validationResult === ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupGETAPISpecs.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationGroupGETAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const rawQueryParams = (event.queryStringParameters || {}) as {
        limit?: string;
        cursor?: string;
        query?: string;
        searchFields?: string;
        root?: string;
      };
      const queryParams: OccupationGroupAPISpecs.GET.Types.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor,
        query: rawQueryParams.query,
        searchFields: rawQueryParams.searchFields,
        root: parseBooleanQueryParam(rawQueryParams.root),
      };

      const validateQueryFunction = ajvInstance.getSchema(
        OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.GET.Types.Request.Query.Payload>;
      const isQueryValid = validateQueryFunction(queryParams);
      if (!isQueryValid) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid query parameters", path: event.path, query: event.queryStringParameters })
        );
      }

      let limit = 100;
      if (queryParams.limit) {
        limit = queryParams.limit;
      }

      // When a search value is provided, delegate to the search path (independent of the root filter). It takes the
      // opaque cursor verbatim and returns an already-encoded nextCursor (keyset for regex search, relevance offset
      // for vector search), so the controller stays agnostic to the search pagination strategy.
      if (queryParams.query !== undefined) {
        if (queryParams.cursor && !isWellFormedSearchCursor(queryParams.cursor)) {
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
        const searchPage = await this.occupationGroupService.searchPaginated(
          requestPathParameter.modelId,
          queryParams.query,
          searchFields,
          queryParams.cursor ?? undefined,
          limit
        );
        return responseJSON(
          StatusCodes.OK,
          transformPaginated(searchPage.items, getResourcesBaseUrl(), limit, searchPage.nextCursor)
        );
      }

      let decodedCursor: { id: string; createdAt: Date } | undefined = undefined;
      if (queryParams.cursor) {
        try {
          decodedCursor = decodeCursor(queryParams.cursor);
        } catch (e: unknown) {
          console.error("Failed to decode cursor:", e);
          return errorResponseGET(
            StatusCodes.BAD_REQUEST,
            ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
            "Invalid cursor parameter",
            ""
          );
        }
      }

      const currentPageOccupationGroups = await this.occupationGroupService.findPaginated(
        requestPathParameter.modelId,
        decodedCursor,
        limit,
        true,
        {
          root: queryParams.root,
        }
      );

      let nextCursor: string | null = null;
      if (currentPageOccupationGroups?.nextCursor?._id) {
        nextCursor = encodeCursor(
          currentPageOccupationGroups.nextCursor._id,
          currentPageOccupationGroups.nextCursor.createdAt
        );
      }
      return responseJSON(
        StatusCodes.OK,
        transformPaginated(currentPageOccupationGroups.items, getResourcesBaseUrl(), limit, nextCursor)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to retrieve occupation groups:", error);
      errorLoggerInstance.logError("Failed to retrieve the occupation groups from the DB", error.name);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupGETAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        "Failed to retrieve the occupation groups from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationGroupListController().getOccupationGroups(event);
};
