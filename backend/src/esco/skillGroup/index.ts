import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  errorResponse,
  errorResponseGET,
  responseJSON,
  HTTP_VERBS,
  StatusCodes,
  STD_ERRORS_RESPONSES,
} from "server/httpUtils";
import { ajvInstance } from "validator";
import AuthAPISpecs from "api-specifications/auth";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { ValidateFunction } from "ajv";
import { transform, transformPaginated } from "./transform";
import { getResourcesBaseUrl } from "server/config/config";

import { ModelForSkillGroupValidationErrorCode } from "./skillGroup.types";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import ErrorAPISpecs from "api-specifications/error";
import { pathToRegexp } from "path-to-regexp";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ISkillGroupService } from "./skillGroupService.type";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  const skillGroupController = new SkillGroupController();
  if (event?.httpMethod === HTTP_VERBS.GET) {
    const pathToMatch = event.path || "";
    const individualMatch = pathToRegexp(Routes.SKILL_GROUP_ROUTE).regexp.exec(pathToMatch);
    return individualMatch ? skillGroupController.getSkillGroup(event) : skillGroupController.getSkillGroups(event);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

export class SkillGroupController {
  private readonly skillGroupService: ISkillGroupService;
  constructor() {
    this.skillGroupService = getServiceRegistry().skillGroup;
  }

  /**
   * Encode an object {_id: string, createdAt: Date} into a base64 string
   * @param {string} id - The Document id to encode
   * @param {Date} createdAt - The Document creation date to encode
   * @return {string} - The base64 encoded cursor
   */
  private encodeCursor(id: string, createdAt: Date): string {
    const payload = {
      id: id,
      createdAt: createdAt.toISOString(),
    };
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString("base64");
  }

  /**
   * Decode a base64 string into an object {_id: string, createdAt: Date}
   * @param {string} cursor - The base64 encoded cursor
   * @return {{id: string, createdAt: Date}} - The decoded object
   */
  private decodeCursor(cursor: string): { id: string; createdAt: Date } {
    const json = Buffer.from(cursor, "base64").toString("utf-8");
    const payload = JSON.parse(json);
    return {
      id: payload.id,
      createdAt: new Date(payload.createdAt),
    };
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
      // extract the modelId from the pathParameters
      // NOTE: Since we're using a single '{proxy+}' resource in API Gateway path params
      // like `{modelId}` are not populated under `pathParameters` instead, the full path is put in
      // `pathParameters.proxy` and `event.path`. To support both setups (explicit param resource and proxy),
      // we fallback to parse the `event.path` if `pathParameters.modelId` is absent.
      const modelIdFromParams = event.pathParameters?.modelId;
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.SKILL_GROUPS_ROUTE).regexp.exec(pathToMatch);
      const resolvedModelId = modelIdFromParams ?? (execMatch ? execMatch[1] : undefined);
      if (!resolvedModelId) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
          "modelId is missing in the path",
          JSON.stringify({ path: event.path, pathParameters: event.pathParameters, query: event.queryStringParameters })
        );
      }

      const requestPathParameter: SkillGroupAPISpecs.Types.GET.Request.Param.Payload = {
        modelId: resolvedModelId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload.$id as string
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
          SkillGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const rawQueryParams = (event.queryStringParameters || {}) as { limit?: string; cursor?: string };
      const queryParams: SkillGroupAPISpecs.Types.GET.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor,
      };

      const validateQueryFunction = ajvInstance.getSchema(
        SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload.$id as string
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

      // extract the nextCursor and the limit from the query parameter
      let limit = 100;
      if (queryParams.limit) {
        limit = queryParams.limit;
      }
      // here decode the cursor base64 if provided
      let decodedCursor: { id: string; createdAt: Date } | undefined = undefined;
      if (queryParams.cursor) {
        try {
          decodedCursor = this.decodeCursor(queryParams.cursor);
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
      // here call the service to get the skill group by limit starting from the cursor
      const currentPageSkillGroups = await this.skillGroupService.findPaginated(
        requestPathParameter.modelId,
        decodedCursor,
        limit
      );

      let nextCursor: string | null = null;
      if (currentPageSkillGroups?.nextCursor?._id) {
        nextCursor = this.encodeCursor(
          currentPageSkillGroups.nextCursor._id,
          currentPageSkillGroups.nextCursor.createdAt
        );
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
        SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        "Failed to retrieve the skill groups from the DB",
        ""
      );
    }
  }

  /**
   * @openapi
   *
   * /models/{modelId}/skillGroups/{id}:
   *  get:
   *   operationId: GETSkillGroupById
   *   tags:
   *    - skillGroups
   *   summary: Get an skill group by its identifier in a taxonomy model.
   *   description: Retrieve an skill group by its unique identifier in a specific taxonomy model.
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
   *   responses:
   *     '200':
   *       description: Successfully retrieved the skill group.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SkillGroupResponseSchemaGETById'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Skill group not found.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETSkillGroup404ErrorSchema'
   *     '500':
   *       description: |
   *         The server encountered an unexpected condition.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getSkillGroup(event: APIGatewayProxyEvent) {
    try {
      const idFromParams = event.pathParameters?.id;
      const modelIdFromParams = event.pathParameters?.modelId;
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.SKILL_GROUP_ROUTE).regexp.exec(pathToMatch);
      const resolvedSkillGroupId = idFromParams ?? (execMatch ? execMatch[2] : "");
      const resolvedModelId = modelIdFromParams ?? (execMatch ? execMatch[1] : "");

      const requestPathParameter: SkillGroupAPISpecs.Types.GET.Request.Detail.Param.Payload = {
        modelId: resolvedModelId,
        id: resolvedSkillGroupId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id as string
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
          SkillGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      const skillGroup = await this.skillGroupService.findById(requestPathParameter.id);
      if (!skillGroup) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
          "skill group not found",
          `No skill group found with id: ${requestPathParameter.id}`
        );
      }
      return responseJSON(StatusCodes.OK, transform(skillGroup, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to get skill group by id:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the skill group from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        "Failed to retrieve the skill group from the DB",
        ""
      );
    }
  }
}
