import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForSkillValidationErrorCode } from "../../../_shared/skill.types";
import { encodeCursor } from "../../../../occupations/_shared/pagination/encodeCursor";
import { extractAndValidateIdParams } from "../../../_shared/params";
import { getResourcesBaseUrl } from "server/config/config";
import { parseOccupationsGETQuery } from "./query";
import { buildOccupationsGETResponse } from "./response";

export class SkillOccupationsGetController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}/occupations:
   *   get:
   *    operationId: GETSkillOccupations
   *    tags:
   *      - skills
   *    summary: Get a list of skill occupations.
   *    description: Retrieve a paginated list of occupations that require a given skill.
   *    security:
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestByIdParamSchemaGET/properties/modelId'
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestByIdParamSchemaGET/properties/id'
   *      - in: query
   *        name: limit
   *        schema:
   *          $ref: '#/components/schemas/SkillOccupationsRequestQueryParamSchemaGET/properties/limit'
   *      - in: query
   *        name: cursor
   *        schema:
   *          $ref: '#/components/schemas/SkillOccupationsRequestQueryParamSchemaGET/properties/cursor'
   *    responses:
   *      '200':
   *        description: Successfully retrieved the skill occupations.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/SkillOccupationsResponseSchemaGET'
   *      '400':
   *        description: Failed to retrieve the skill occupations. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillOccupations400ErrorSchema'
   *      '404':
   *        description: Model or Skill not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillOccupations404ErrorSchema'
   *      '500':
   *        description: The server encountered an unexpected condition.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async get(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const params = extractAndValidateIdParams(event, Routes.SKILL_OCCUPATIONS_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      const service = getServiceRegistry().skill;
      const validationResult = await service.validateModelForSkill(params.modelId);
      if (validationResult === ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.GET.Errors.Status404.Occupations.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillAPISpecs.GET.Errors.Status500.Occupations.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_OCCUPATIONS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const paginationParams = parseOccupationsGETQuery(event);
      if ("statusCode" in paginationParams) {
        return paginationParams;
      }

      const skill = await service.findById(params.id);
      if (!skill) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.GET.Errors.Status404.Occupations.ErrorCodes.SKILL_NOT_FOUND,
          "Skill not found",
          `No skill found with id: ${params.id}`
        );
      }

      const result = await service.getOccupations(
        params.modelId,
        params.id,
        paginationParams.limit,
        paginationParams.decodedCursor
      );
      let nextCursor: string | null = null;
      if (result?.nextCursor?._id) {
        nextCursor = encodeCursor(result.nextCursor._id, result.nextCursor.createdAt);
      }

      return responseJSON(
        StatusCodes.OK,
        buildOccupationsGETResponse(result.items, getResourcesBaseUrl(), paginationParams.limit, nextCursor)
      );
    } catch (error: unknown) {
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.GET.Errors.Status500.Occupations.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_OCCUPATIONS,
        "Failed to retrieve skill occupations from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillOccupationsGetController().get(event);
};
