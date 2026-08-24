import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import AuthAPISpecs from "api-specifications/auth";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { RoleRequired } from "auth/authorizer";
import {
  IPartialUpdateSkillGroupSpec,
  ModelForSkillGroupValidationErrorCode,
} from "esco/skillGroup/_shared/skillGroup.types";
import { SkillGroupModelValidationError } from "esco/skillGroup/services/skillGroup.service.type";
import { Routes } from "routes.constant";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { extractAndValidateIdParams } from "../../_shared/params";
import { parseAndValidatePATCHRequest } from "./request";
import { buildPATCHResponse } from "./response";

export class SkillGroupPATCHController {
  /**
   * @openapi
   *
   * /models/{modelId}/skillGroups/{id}:
   *    patch:
   *      operationId: PATCHSkillGroup
   *      tags:
   *        - skillGroups
   *      summary: Update an existing taxonomy skill group.
   *      description: Update an existing taxonomy skill group in a specific taxonomy model.
   *      security:
   *       - api_key: []
   *       - jwt_auth: []
   *      parameters:
   *        - in: path
   *          name: modelId
   *          required: true
   *          schema:
   *            $ref: '#/components/schemas/SkillGroupRequestByIdParamSchemaGET/properties/modelId'
   *        - in: path
   *          name: id
   *          required: true
   *          schema:
   *            $ref: '#/components/schemas/SkillGroupRequestByIdParamSchemaGET/properties/id'
   *      requestBody:
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SkillGroupRequestSchemaPATCH'
   *         required: true
   *      responses:
   *         '200':
   *           description: Successfully updated the skill group,
   *           content:
   *             application/json:
   *               schema:
   *                  $ref: '#/components/schemas/SkillGroupResponseSchemaPATCH'
   *         '400':
   *           description: |
   *             Failed to update the skill group. Additional information can be found in the response body.
   *           content:
   *             application/json:
   *                schema:
   *                  $ref: '#/components/schemas/PATCHSkillGroup400ErrorSchema'
   *         '403':
   *           description: |
   *             The request has not been applied because you don't have the right permissions to access this resource.
   *           content:
   *             application/json:
   *               schema:
   *                 $ref: '#/components/schemas/AllForbidden403ResponseSchema'
   *         '401':
   *           $ref: '#/components/responses/UnAuthorizedResponse'
   *         '415':
   *           description: |
   *             The request is not supported because the media type is not acceptable.
   *           content:
   *             application/json:
   *               schema:
   *                 $ref: '#/components/schemas/AllContentType415ResponseSchema'
   *         '500':
   *           description: |
   *             The server encountered an unexpected condition.
   *           content:
   *             application/json:
   *               schema:
   *                 $ref: '#/components/schemas/All500ResponseSchema'
   *
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async patch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const parsedRequestResult = parseAndValidatePATCHRequest(event);
    if ("statusCode" in parsedRequestResult) {
      return parsedRequestResult;
    }
    const payload = parsedRequestResult;

    const params = extractAndValidateIdParams(event, Routes.SKILL_GROUP_ROUTE);
    if ("statusCode" in params) {
      return params;
    }

    if (payload.modelId !== undefined && payload.modelId !== params.modelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        SkillGroupAPISpecs.SkillGroup.PATCH.Errors.Response.Status400.ErrorCodes.INVALID_MODEL_ID,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${params.modelId}`
      );
    }

    const spec: IPartialUpdateSkillGroupSpec = {};
    if (payload.originUri !== undefined) spec.originUri = payload.originUri;
    if (payload.code !== undefined) spec.code = payload.code;
    if (payload.preferredLabel !== undefined) spec.preferredLabel = payload.preferredLabel;
    if (payload.altLabels !== undefined) spec.altLabels = payload.altLabels;
    if (payload.description !== undefined) spec.description = payload.description;
    if (payload.scopeNote !== undefined) spec.scopeNote = payload.scopeNote;
    if (payload.modelId !== undefined) spec.modelId = payload.modelId;
    if (payload.UUIDHistory !== undefined) spec.UUIDHistory = payload.UUIDHistory;

    try {
      const service = getServiceRegistry().skillGroup;
      const updatedSkillGroup = await service.patch(params.id, params.modelId, spec);
      if (!updatedSkillGroup) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillGroupAPISpecs.SkillGroup.PATCH.Errors.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
          "Skill group not found",
          `No skill group found with id: ${params.id}`
        );
      }
      return responseJSON(StatusCodes.OK, buildPATCHResponse(updatedSkillGroup, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to patch skill group:", error);

      if (error instanceof SkillGroupModelValidationError) {
        switch (error.code) {
          case ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              SkillGroupAPISpecs.SkillGroup.PATCH.Errors.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              SkillGroupAPISpecs.SkillGroup.PATCH.Errors.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot update skill groups in a released model",
              ""
            );
          case ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillGroupAPISpecs.SkillGroup.PATCH.Errors.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_SKILL_GROUP,
              "Failed to fetch the model details from the DB",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillGroupAPISpecs.SkillGroup.PATCH.Errors.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_SKILL_GROUP,
              "Failed to update the skill group in the DB",
              ""
            );
        }
      }

      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillGroupAPISpecs.SkillGroup.PATCH.Errors.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_SKILL_GROUP,
        "Failed to update the skill group in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillGroupPATCHController().patch(event);
};
