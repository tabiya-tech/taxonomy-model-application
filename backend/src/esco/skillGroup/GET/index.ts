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
import { ISkillGroupService } from "../services/skillGroup.service.type";
import { decodeCursor, encodeCursor, getSkillGroupsPathParameters } from "./query";
import { transformPaginated } from "./response";

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
   *        name: childrenIds
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestQueryParamSchemaGET/properties/childrenIds'
   *      - in: query
   *        name: childrenType
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestQueryParamSchemaGET/properties/childrenType'
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
        childrenIds?: string;
        childrenType?: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes;
      };
      const queryParams: SkillGroupAPISpecs.Types.GET.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor,
        childrenIds: rawQueryParams.childrenIds,
        childrenType: rawQueryParams.childrenType,
      };

      const validateQueryFunction = ajvInstance.getSchema(
        SkillGroupGETAPISpecs.Schemas.Request.Query.Payload.$id as string
      ) as ValidateFunction<SkillGroupAPISpecs.Types.GET.Request.Query.Payload>;
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

      const paginationFilter =
        queryParams.childrenIds && queryParams.childrenType
          ? {
              childrenIds: queryParams.childrenIds,
              childrenType: queryParams.childrenType,
            }
          : undefined;

      const currentPageSkillGroups = paginationFilter
        ? await this.skillGroupService.findPaginated(
            requestPathParameter.modelId,
            decodedCursor,
            limit,
            true,
            paginationFilter
          )
        : await this.skillGroupService.findPaginated(requestPathParameter.modelId, decodedCursor, limit);

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
