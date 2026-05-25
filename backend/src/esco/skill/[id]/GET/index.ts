import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { RoleRequired } from "auth/authorizer";
import { getResourcesBaseUrl } from "server/config/config";
import { parseSkillByIdGETPath } from "./query";
import { buildSkillByIdGETResponse } from "./response";

export class SkillGetByIdController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}:
   *  get:
   *   operationId: GETSkillById
   *   tags:
   *    - skills
   *   summary: Get a skill by its identifier in a taxonomy model.
   *   description: Retrieve a skill by its unique identifier in a specific taxonomy model.
   *   security:
   *    - jwt_auth: []
   *   parameters:
   *    - in: path
   *      name: modelId
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/SkillRequestByIdParamSchemaGET/properties/modelId'
   *    - in: path
   *      name: id
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/SkillRequestByIdParamSchemaGET/properties/id'
   *   responses:
   *     '200':
   *       description: Successfully retrieved the skill.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SkillResponseSchemaGETById'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Skill not found.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETSkill404ErrorSchema'
   *     '500':
   *       description: |
   *         The server encountered an unexpected condition.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async get(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const params = parseSkillByIdGETPath(event);
      if ("statusCode" in params) {
        return params;
      }

      const service = getServiceRegistry().skill;
      const skill = await service.findById(params.id);
      if (!skill) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.GET.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
          "Skill not found",
          `No skill found with id: ${params.id}`
        );
      }

      return responseJSON(StatusCodes.OK, buildSkillByIdGETResponse(skill, getResourcesBaseUrl()));
    } catch (error: unknown) {
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL,
        "Failed to retrieve the skill from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillGetByIdController().get(event);
};
