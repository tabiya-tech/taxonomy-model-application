import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { buildGETResponse } from "./response";
import { parseGETQuery } from "./query";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForSkillValidationErrorCode } from "../_shared/skill.types";
import { encodeCursor } from "../../occupations/_shared/pagination/encodeCursor";
import { extractAndValidateModelIdParam } from "../_shared/params";
import { getResourcesBaseUrl } from "server/config/config";

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
   *    responses:
   *      '200':
   *        description: Successfully retrieved the paginated skills.
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
      if (validationResult === ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.GET.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILLS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const paginationParams = parseGETQuery(event);
      if ("statusCode" in paginationParams) {
        return paginationParams;
      }

      let decodedCursorObj: { id: string; createdAt: Date } | undefined = undefined;
      if (event.queryStringParameters?.cursor) {
        const { decodeCursor } = await import("../../occupations/_shared/pagination/decodeCursor");
        decodedCursorObj = decodeCursor(event.queryStringParameters.cursor);
      }

      const currentPageSkills = await service.findPaginated(params.modelId, decodedCursorObj, paginationParams.limit);

      let nextCursor: string | null = null;
      if (currentPageSkills?.nextCursor?._id) {
        nextCursor = encodeCursor(currentPageSkills.nextCursor._id, currentPageSkills.nextCursor.createdAt);
      }

      return responseJSON(
        StatusCodes.OK,
        buildGETResponse(currentPageSkills.items, getResourcesBaseUrl(), paginationParams.limit, nextCursor)
      );
    } catch (error: unknown) {
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
