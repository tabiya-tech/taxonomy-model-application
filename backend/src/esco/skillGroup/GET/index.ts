import mongoose from "mongoose";
import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import ErrorAPISpecs from "api-specifications/error";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import SkillGroupGETAPISpecs from "api-specifications/esco/skillGroup/GET";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance } from "validator";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ModelForSkillGroupValidationErrorCode } from "../_shared/skillGroup.types";
import { ISkillGroupPaginatedFilter, ISkillGroupService } from "../services/skillGroup.service.type";
import { decodeCursor, encodeCursor, getSkillGroupsPathParameters } from "./query";
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

export class SkillGroupListController {
  private readonly skillGroupService: ISkillGroupService;

  constructor() {
    this.skillGroupService = getServiceRegistry().skillGroup;
  }

  /**
   * @openapi
   *
   * /models/{modelId}/skillGroups:
   *   get:
   *    operationId: GETSkillGroups
   *    tags:
   *      - skillGroups
   *    summary: Get a list of paginated skill groups and cursor if there is one in a taxonomy model.
   *    description: Retrieve a list of paginated skill groups in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestParamSchemaGET/properties/modelId'
   *      - in: query
   *        name: limit
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestQueryParamSchemaGET/properties/limit'
   *      - in: query
   *        name: cursor
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestQueryParamSchemaGET/properties/cursor'
   *      - in: query
   *        name: query
   *        required: false
   *        description: >
   *          A free-text value to search the skill groups by. When set, the endpoint returns the skill groups
   *          matching the value on the requested searchFields, ranked by relevance. Released models are searched
   *          with vector embeddings; unreleased models with a case-insensitive regex.
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestQueryParamSchemaGET/properties/query'
   *      - in: query
   *        name: searchFields
   *        required: false
   *        description: >
   *          A comma-separated list of the skill group fields to search on (e.g. 'preferredLabel,description').
   *          Only meaningful together with query. Defaults to 'preferredLabel'.
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestQueryParamSchemaGET/properties/searchFields'
   *      - in: query
   *        name: childrenIds
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestQueryParamSchemaGET/properties/childrenIds'
   *      - in: query
   *        name: childrenType
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestQueryParamSchemaGET/properties/childrenType'
   *      - in: query
   *        name: root
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestQueryParamSchemaGET/properties/root'
   *    responses:
   *      '200':
   *        description: Successfully retrieved the paginated skill groups.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/SkillGroupResponseSchemaGET'
   *      '400':
   *        description: |
   *          Failed to retrieve the skill groups. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillGroup400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Model not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillGroups404ErrorSchema'
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
  async getSkillGroups(event: APIGatewayProxyEvent) {
    try {
      const { modelId: resolvedModelId } = getSkillGroupsPathParameters(event.path);
      if (!resolvedModelId) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
          "modelId is missing in the path",
          JSON.stringify({ path: event.path, pathParameters: event.pathParameters, query: event.queryStringParameters })
        );
      }

      const requestPathParameter: SkillGroupAPISpecs.Types.GET.Request.Param.Payload = {
        modelId: resolvedModelId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        SkillGroupGETAPISpecs.Schemas.Request.Param.Payload.$id as string
      ) as ValidateFunction<SkillGroupAPISpecs.Types.GET.Request.Param.Payload>;
      const isValid = validatePathFunction(requestPathParameter);
      if (!isValid) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid modelId", path: event.path, pathParameters: event.pathParameters })
        );
      }

      const validationResult = await this.skillGroupService.validateModelForSkillGroup(requestPathParameter.modelId);
      if (validationResult === ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillGroupGETAPISpecs.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillGroupGETAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const rawQueryParams = (event.queryStringParameters || {}) as {
        limit?: string;
        cursor?: string;
        query?: string;
        searchFields?: string;
        childrenIds?: string;
        childrenType?: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes;
        root?: string;
      };
      const queryParams: SkillGroupGETAPISpecs.Types.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor,
        query: rawQueryParams.query,
        searchFields: rawQueryParams.searchFields,
        childrenIds: rawQueryParams.childrenIds,
        childrenType: rawQueryParams.childrenType,
        root: parseBooleanQueryParam(rawQueryParams.root),
      };

      const validateQueryFunction = ajvInstance.getSchema(
        SkillGroupGETAPISpecs.Schemas.Request.Query.Payload.$id as string
      ) as ValidateFunction<SkillGroupGETAPISpecs.Types.Request.Query.Payload>;
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

      // When a search value is provided, delegate to the search path (independent of the root/childrenIds filters).
      // It takes the opaque cursor verbatim and returns an already-encoded nextCursor (keyset for regex search,
      // relevance offset for vector search), so the controller stays agnostic to the search pagination strategy.
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
        const searchPage = await this.skillGroupService.searchPaginated(
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

      const paginationFilter: ISkillGroupPaginatedFilter = {
        root: queryParams.root,
        ...(queryParams.childrenIds && queryParams.childrenType
          ? {
              childrenIds: queryParams.childrenIds,
              childrenType: queryParams.childrenType,
            }
          : {}),
      };

      const currentPageSkillGroups = await this.skillGroupService.findPaginated(
        requestPathParameter.modelId,
        decodedCursor,
        limit,
        true,
        paginationFilter
      );

      let nextCursor: string | null = null;
      if (currentPageSkillGroups?.nextCursor?._id) {
        nextCursor = encodeCursor(currentPageSkillGroups.nextCursor._id, currentPageSkillGroups.nextCursor.createdAt);
      }
      return responseJSON(
        StatusCodes.OK,
        transformPaginated(currentPageSkillGroups.items, getResourcesBaseUrl(), limit, nextCursor)
      );
    } catch (error: unknown) {
      console.error("Failed to retrieve skill groups:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the skill groups from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillGroupGETAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        "Failed to retrieve the skill groups from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillGroupListController().getSkillGroups(event);
};
