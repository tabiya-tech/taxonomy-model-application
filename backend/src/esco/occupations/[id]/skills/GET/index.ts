import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, response, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";

import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { buildSkillsResponse } from "./response";
import { parseSkillsQuery } from "./query";
import { encodeCursor } from "../../../_shared/pagination/encodeCursor";
import { extractAndValidateIdParams } from "../../../_shared/params";
import { resolveLanguageFromModelResult } from "../../../_shared/resolveLanguageFromModelResult";

export class OccupationSkillsController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}/skills:
   *   get:
   *    operationId: GETOccupationSkillsById
   *    tags:
   *      - occupations
   *    summary: Get an occupation's skills in a taxonomy model.
   *    description: Retrieve the skills associated with an occupation in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestParamSchemaGET/properties/modelId'
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: string
   *          description: The unique ID of the occupation.
   *      - in: query
   *        name: limit
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/OccupationSkillsRequestQueryParamSchemaGET/properties/limit'
   *      - in: query
   *        name: cursor
   *        schema:
   *          $ref: '#/components/schemas/OccupationSkillsRequestQueryParamSchemaGET/properties/cursor'
   *    responses:
   *      '200':
   *        description: Successfully retrieved the occupation skills.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OccupationResponseSchemaGETSkills'
   *      '400':
   *        description: |
   *          Failed to retrieve the occupation skills. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Occupation skills or model not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation404ErrorSchema'
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
  async get(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const params = extractAndValidateIdParams(event, Routes.OCCUPATION_SKILLS_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      const service = getServiceRegistry().occupation;
      const validationResult = await service.validateModelForOccupation(params.modelId);
      const langResult = resolveLanguageFromModelResult(event, validationResult, params.modelId);
      if ("statusCode" in langResult) return langResult;
      const { languageConfig } = langResult;

      const paginationParams = parseSkillsQuery(event);
      if ("statusCode" in paginationParams) {
        return paginationParams;
      }

      const currentPageSkills = await service.getSkills(
        params.modelId,
        params.id,
        paginationParams.decodedCursor,
        paginationParams.limit,
        languageConfig.dbKeyName
      );

      let nextCursor: string | null = null;
      if (currentPageSkills?.nextCursor?._id) {
        nextCursor = encodeCursor(currentPageSkills.nextCursor._id, currentPageSkills.nextCursor.createdAt);
      }

      return response(
        StatusCodes.OK,
        buildSkillsResponse(currentPageSkills.items, getResourcesBaseUrl(), paginationParams.limit, nextCursor),
        { "Content-Type": "application/json", "Content-Language": languageConfig.shortCode, Vary: "Accept-Language" }
      );
    } catch (error: unknown) {
      console.error("Failed to get occupation skills:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the occupation skills from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
        "Failed to retrieve the occupation skills from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationSkillsController().get(event);
};
