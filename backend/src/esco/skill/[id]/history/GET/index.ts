import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, response, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { extractAndValidateIdParams } from "esco/skill/_shared/params";
import { buildHistoryResponse } from "./response";
import { resolveLanguageFromModelResult } from "esco/skill/_shared/resolveLanguageFromModelResult";

export class SkillHistoryGetController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}/history:
   *   get:
   *    operationId: GETSkillHistory
   *    tags:
   *      - skills
   *    summary: Get the model history of a skill.
   *    description: |
   *      Retrieve the list of taxonomy models the skill appeared in, based on its UUIDHistory.
   *      Each entry is the full model information for a model the skill was part of.
   *      UUIDs in the history that no longer resolve to an existing skill are omitted.
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
   *        description: Successfully retrieved the skill history.
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
   *              $ref: '#/components/schemas/SkillResponseSchemaGETHistory'
   *      '400':
   *        description: Failed to retrieve the skill history. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkill400ErrorSchema'
   *      '404':
   *        description: Model or Skill not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkill404ErrorSchema'
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
      const params = extractAndValidateIdParams(event, Routes.SKILL_HISTORY_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      const service = getServiceRegistry().skill;
      // The skill's own model must exist, but unlike write operations a released model is valid here: the history
      // intentionally includes released models, so MODEL_IS_RELEASED (and null) are accepted.
      // TODO(CORE-766): When MODEL_IS_RELEASED, availableLanguages is empty and language falls back to the default,
      // even if the requested language is present in historical models. This is intentional — we resolve language
      // from the current model only, not across all history entries.
      const validationResult = await service.validateModelForSkill(params.modelId);
      const langResult = resolveLanguageFromModelResult(
        event,
        validationResult,
        params.modelId,
        SkillAPISpecs.GET.Errors.Status500.History.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_HISTORY
      );
      if ("statusCode" in langResult) return langResult;
      const { languageConfig } = langResult;
      const language = languageConfig.dbKeyName;
      const languageHeaders = {
        "Content-Type": "application/json",
        "Content-Language": languageConfig.shortCode,
        Vary: "Accept-Language",
      };

      const history = await service.getHistory(params.id, language);
      if (history === null) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.GET.Errors.Status404.History.ErrorCodes.SKILL_NOT_FOUND,
          "Skill not found",
          `No skill found with id: ${params.id}`
        );
      }

      return response(StatusCodes.OK, buildHistoryResponse(history), languageHeaders);
    } catch (error: unknown) {
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.GET.Errors.Status500.History.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_HISTORY,
        "Failed to retrieve skill history from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillHistoryGetController().get(event);
};
