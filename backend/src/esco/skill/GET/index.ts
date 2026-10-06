import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, response, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { buildGETResponse } from "./response";
import { parseGETQuery } from "./query";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { extractAndValidateModelIdParam } from "../_shared/params";
import { getResourcesBaseUrl } from "server/config/config";
import { resolveLanguageFromModelResult } from "../_shared/resolveLanguageFromModelResult";
import { SearchCursorLanguageMismatchError } from "esco/common/searchCursor";

export class SkillGetController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills:
   *   get:
   *    operationId: GETSkills
   *    tags:
   *      - skills
   *    summary: Get a paginated list of skills in a taxonomy model.
   *    description: Retrieve a paginated list of skills in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestParamSchemaGET/properties/modelId'
   *      - in: query
   *        name: limit
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestQueryParamSchemaGET/properties/limit'
   *      - in: query
   *        name: cursor
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestQueryParamSchemaGET/properties/cursor'
   *      - in: query
   *        name: query
   *        required: false
   *        description: >
   *          A free-text value to search the skills by. When set, the endpoint returns the skills matching the
   *          value on the requested searchFields, ranked by relevance. Released models are searched with vector
   *          embeddings; unreleased models with a case-insensitive regex.
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestQueryParamSchemaGET/properties/query'
   *      - in: query
   *        name: searchFields
   *        required: false
   *        description: >
   *          A comma-separated list of the skill fields to search on (e.g. 'preferredLabel,description').
   *          Only meaningful together with query. Defaults to 'preferredLabel'.
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestQueryParamSchemaGET/properties/searchFields'
   *      - in: header
   *        name: Accept-Language
   *        required: false
   *        schema:
   *          type: string
   *          example: "fr, en;q=0.9"
   *        description: >
   *          Preferred response language. The server picks the best match from the model's available languages
   *          and falls back to the default language if none match.
   *    responses:
   *      '200':
   *        description: Successfully retrieved the paginated skills.
   *        headers:
   *          Content-Language:
   *            schema:
   *              type: string
   *              example: "fr"
   *            description: The language of the response body.
   *          Vary:
   *            schema:
   *              type: string
   *              example: "Accept-Language"
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/SkillResponseSchemaGET'
   *      '400':
   *        description: |
   *          Failed to retrieve the skills. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkill400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Skills not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkills404ErrorSchema'
   *      '500':
   *        $ref: '#/components/responses/InternalServerErrorResponse'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async get(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const params = extractAndValidateModelIdParam(event, Routes.SKILLS_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      const service = getServiceRegistry().skill;
      const validationResult = await service.validateModelForSkill(params.modelId);
      const langResult = resolveLanguageFromModelResult(event, validationResult, params.modelId);
      if ("statusCode" in langResult) return langResult;
      const { languageConfig } = langResult;
      const language = languageConfig.dbKeyName;
      const languageHeaders = {
        "Content-Type": "application/json",
        "Content-Language": languageConfig.shortCode,
        Vary: "Accept-Language",
      };

      const queryParams = parseGETQuery(event);
      if ("statusCode" in queryParams) {
        return queryParams;
      }

      // A single service call handles both plain listing and search (when a searchValue is provided). It takes the
      // opaque cursor verbatim and returns an already-encoded nextCursor, so the controller stays agnostic to the
      // pagination strategy (keyset for the plain list / regex search, relevance offset for vector search).
      const currentPageSkills = await service.findPaginated(
        params.modelId,
        event.queryStringParameters?.cursor ?? undefined,
        queryParams.limit,
        queryParams.searchValue,
        queryParams.searchFields,
        undefined,
        language
      );

      return response(
        StatusCodes.OK,
        buildGETResponse(
          currentPageSkills.items,
          getResourcesBaseUrl(),
          queryParams.limit,
          currentPageSkills.nextCursor
        ),
        languageHeaders
      );
    } catch (error: unknown) {
      if (error instanceof SearchCursorLanguageMismatchError) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          SkillAPISpecs.GET.Errors.Status400.ErrorCodes.INVALID_NEXT_CURSOR_PARAMETER,
          error.message,
          ""
        );
      }
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILLS,
        "Failed to retrieve the skills from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillGetController().get(event);
};
