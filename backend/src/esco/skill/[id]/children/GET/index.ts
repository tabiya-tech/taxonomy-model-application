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
import { parseChildrenGETQuery } from "./query";
import { buildChildrenGETResponse } from "./response";

export class SkillChildrenGetController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}/children:
   *   get:
   *    operationId: GETSkillChildren
   *    tags:
   *      - skills
   *    summary: Get a list of skill children.
   *    description: Retrieve a paginated list of child skills or skill groups for a given skill.
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
   *          $ref: '#/components/schemas/SkillChildrenRequestQueryParamSchemaGET/properties/limit'
   *      - in: query
   *        name: cursor
   *        schema:
   *          $ref: '#/components/schemas/SkillChildrenRequestQueryParamSchemaGET/properties/cursor'
   *    responses:
   *      '200':
   *        description: Successfully retrieved the skill children.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/SkillChildrenResponseSchemaGET'
   *      '400':
   *        description: Failed to retrieve the skill children. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillChildren400ErrorSchema'
   *      '404':
   *        description: Model or Skill not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillChildren404ErrorSchema'
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
      const params = extractAndValidateIdParams(event, Routes.SKILL_CHILDREN_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      const service = getServiceRegistry().skill;
      const validationResult = await service.validateModelForSkill(params.modelId);
      if (validationResult === ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.GET.Errors.Status404.Children.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillAPISpecs.GET.Errors.Status500.Children.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_CHILDREN,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const paginationParams = parseChildrenGETQuery(event);
      if ("statusCode" in paginationParams) {
        return paginationParams;
      }

      const skill = await service.findById(params.id);
      if (!skill) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.GET.Errors.Status404.Children.ErrorCodes.SKILL_NOT_FOUND,
          "Skill not found",
          `No skill found with id: ${params.id}`
        );
      }

      const result = await service.getChildren(
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
        buildChildrenGETResponse(result.items, getResourcesBaseUrl(), paginationParams.limit, nextCursor)
      );
    } catch (error: unknown) {
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.GET.Errors.Status500.Children.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_CHILDREN,
        "Failed to retrieve skill children from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillChildrenGetController().get(event);
};
