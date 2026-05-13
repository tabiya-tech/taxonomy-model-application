import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import SkillGroupDetailAPISpecs from "api-specifications/esco/skillGroup/[id]";
import ErrorAPISpecs from "api-specifications/error";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance } from "validator";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ModelForSkillGroupValidationErrorCode } from "../../../_shared/skillGroup.types";
import { ISkillGroupService } from "../../../services/skillGroup.service.type";
import { decodeCursor, encodeCursor } from "../../../GET/query";
import { getSkillGroupParentsPathParameters } from "./query";
import { transformPaginatedParents } from "./response";

export class SkillGroupParentsController {
  private readonly skillGroupService: ISkillGroupService;

  constructor() {
    this.skillGroupService = getServiceRegistry().skillGroup;
  }

  /**
   * @openapi
   *
   * /models/{modelId}/skillGroups/{id}/parents:
   *  get:
   *   operationId: GETSkillGroupParentsById
   *   tags:
   *    - skillGroups
   *   summary: Get an skill group's parents by its identifier in a taxonomy model.
   *   description: Retrieve a collection of parents for skill group by its unique identifier in a specific taxonomy model.
   *   security:
   *    - api_key: []
   *    - jwt_auth: []
   *   parameters:
   *    - in: path
   *      name: modelId
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/SkillGroupRequestByIdParamSchemaGET/properties/modelId'
   *    - in: path
   *      name: id
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/SkillGroupRequestByIdParamSchemaGET/properties/id'
   *    - in: query
   *      name: limit
   *      required: false
   *      schema:
   *        $ref: '#/components/schemas/SkillGroupParentsRequestQueryParamSchemaGET/properties/limit'
   *    - in: query
   *      name: cursor
   *      schema:
   *        $ref: '#/components/schemas/SkillGroupParentsRequestQueryParamSchemaGET/properties/cursor'
   *   responses:
   *     '200':
   *       description: Successfully retrieved the skill group parents.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SkillGroupParentsResponseSchemaGET'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Skill group not found or model not found. When the skill group exists but has no parents, returns 200 with empty data array.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETSkillGroupParents404ErrorSchema'
   *     '500':
   *       description: |
   *         The server encountered an unexpected condition.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getSkillGroupParents(event: APIGatewayProxyEvent) {
    try {
      const requestPathParameter = getSkillGroupParentsPathParameters(event.path);
      const validatePathFunction = ajvInstance.getSchema(
        SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload.$id as string
      ) as ValidateFunction<SkillGroupAPISpecs.Types.GET.Request.Detail.Param.Payload>;

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

      const validationResult = await this.skillGroupService.validateModelForSkillGroup(requestPathParameter.modelId);
      if (validationResult === ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillGroupAPISpecs.SkillGroup.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const skillGroup = await this.skillGroupService.findById(requestPathParameter.id);
      if (!skillGroup || skillGroup.modelId !== requestPathParameter.modelId) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillGroupAPISpecs.SkillGroup.GET.Enums.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
          "Skill group not found",
          `No skill group found with id: ${requestPathParameter.id}`
        );
      }

      const rawQueryParams = (event.queryStringParameters || {}) as { limit?: string; cursor?: string };
      const queryParams: SkillGroupAPISpecs.Types.GET.Parents.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor ?? undefined,
      };

      const validateQueryFunction = ajvInstance.getSchema(
        SkillGroupAPISpecs.GET.Schemas.Request.Query.Payload.$id as string
      ) as ValidateFunction<SkillGroupAPISpecs.Types.GET.Parents.Request.Query.Payload>;
      const isQueryValid = validateQueryFunction(queryParams);
      if (!isQueryValid) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid query parameters", path: event.path, query: event.queryStringParameters })
        );
      }

      let limit = SkillGroupAPISpecs.Constants.DEFAULT_LIMIT;
      if (queryParams.limit) limit = queryParams.limit;

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

      const result = await this.skillGroupService.findParents(
        requestPathParameter.modelId,
        requestPathParameter.id,
        limit,
        decodedCursor?.id
      );

      let nextCursor: string | null = null;
      if (result.nextCursor) {
        nextCursor = encodeCursor(result.nextCursor._id, result.nextCursor.createdAt);
      }
      return responseJSON(
        StatusCodes.OK,
        transformPaginatedParents(result.items, getResourcesBaseUrl(), limit, nextCursor)
      );
    } catch (error: unknown) {
      console.error("Failed to get skill group parents:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the skill group parents from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        "Failed to retrieve the skill group parents from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillGroupParentsController().getSkillGroupParents(event);
};
