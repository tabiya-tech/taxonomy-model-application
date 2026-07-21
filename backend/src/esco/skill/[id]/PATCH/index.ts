import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";

import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { buildPATCHResponse } from "./response";
import { parseAndValidatePATCHRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { IPartialUpdateSkillSpec, ModelForSkillValidationErrorCode } from "../../_shared/skill.types";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { SkillModelValidationError } from "../../services/skill.service.types";
import { extractAndValidateIdParams } from "../../_shared/params";

export class SkillPATCHController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}:
   *   patch:
   *     operationId: PATCHSkillById
   *     tags:
   *       - skills
   *     summary: Partially update a skill by its ID.
   *     description: Update one or more fields of an existing skill in a specific taxonomy model. Only provided fields are updated.
   *     security:
   *       - api_key: []
   *       - jwt_auth: []
   *     parameters:
   *       - in: path
   *         name: modelId
   *         required: true
   *         schema:
   *           $ref: '#/components/schemas/SkillRequestParamSchemaGET/properties/modelId'
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           description: The unique ID of the skill to update.
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SkillRequestSchemaPATCH'
   *       required: true
   *     responses:
   *       '200':
   *         description: Successfully updated the skill.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SkillResponseSchemaPATCH'
   *       '400':
   *         description: |
   *           Failed to update the skill. Additional information can be found in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PATCHSkill400ErrorSchema'
   *       '401':
   *         $ref: '#/components/responses/UnAuthorizedResponse'
   *       '403':
   *         description: |
   *           The request has not been applied because you don't have the right permissions to access this resource.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AllForbidden403ResponseSchema'
   *       '404':
   *         description: Skill or model not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PATCHSkill404ErrorSchema'
   *       '415':
   *         description: |
   *           The request is not supported because the media type is not acceptable.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AllContentType415ResponseSchema'
   *       '500':
   *         description: |
   *           The server encountered an unexpected condition.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/All500ResponseSchema'
   *
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async patch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const parsedRequestResult = parseAndValidatePATCHRequest(event);
    if ("statusCode" in parsedRequestResult) {
      return parsedRequestResult;
    }
    const payload = parsedRequestResult;

    const params = extractAndValidateIdParams(event, Routes.SKILL_ROUTE);
    if ("statusCode" in params) {
      return params;
    }

    if (payload.modelId !== undefined && payload.modelId !== params.modelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        SkillAPISpecs.Skill.PATCH.Errors.Status400.ErrorCodes.INVALID_MODEL_ID,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${params.modelId}`
      );
    }

    const spec: IPartialUpdateSkillSpec = {};
    if (payload.preferredLabel !== undefined) spec.preferredLabel = payload.preferredLabel;
    if (payload.originUri !== undefined) spec.originUri = payload.originUri;
    if (payload.altLabels !== undefined) spec.altLabels = payload.altLabels;
    if (payload.definition !== undefined) spec.definition = payload.definition;
    if (payload.description !== undefined) spec.description = payload.description;
    if (payload.scopeNote !== undefined) spec.scopeNote = payload.scopeNote;
    if (payload.skillType !== undefined) spec.skillType = payload.skillType;
    if (payload.reuseLevel !== undefined) spec.reuseLevel = payload.reuseLevel;
    if (payload.modelId !== undefined) spec.modelId = payload.modelId;
    if (payload.UUIDHistory !== undefined) spec.UUIDHistory = payload.UUIDHistory;
    if (payload.isLocalized !== undefined) spec.isLocalized = payload.isLocalized;

    try {
      const service = getServiceRegistry().skill;
      const updatedSkill = await service.patch(params.id, params.modelId, spec);
      if (!updatedSkill) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.Skill.PATCH.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
          "Skill not found",
          `No skill found with id: ${params.id}`
        );
      }
      return responseJSON(StatusCodes.OK, buildPATCHResponse(updatedSkill, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to patch skill:", error);

      if (error instanceof SkillModelValidationError) {
        switch (error.code) {
          case ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              SkillAPISpecs.Skill.PATCH.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForSkillValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              SkillAPISpecs.Skill.PATCH.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot update skills in a released model",
              ""
            );
          case ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillAPISpecs.Skill.PATCH.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_SKILL,
              "Failed to fetch the model details from the DB",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillAPISpecs.Skill.PATCH.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_SKILL,
              "Failed to update the skill in the DB",
              ""
            );
        }
      } else {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillAPISpecs.Skill.PATCH.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_SKILL,
          "Failed to update the skill in the DB",
          ""
        );
      }
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillPATCHController().patch(event);
};
