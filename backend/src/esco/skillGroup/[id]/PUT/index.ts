import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import AuthAPISpecs from "api-specifications/auth";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { RoleRequired } from "auth/authorizer";
import { IUpdateSkillGroupSpec, ModelForSkillGroupValidationErrorCode } from "esco/skillGroup/_shared/skillGroup.types";
import { SkillGroupModelValidationError } from "esco/skillGroup/services/skillGroup.service.type";
import { Routes } from "routes.constant";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { extractAndValidateIdParams } from "../../_shared/params";
import { parseAndValidatePUTRequest } from "./request";
import { buildPUTResponse } from "./response";

export class SkillGroupPUTController {
  /**
   * @openapi
   *
   * /models/{modelId}/skillGroups/{id}:
   *    put:
   *      operationId: PUTSkillGroup
   *      tags:
   *        - skillGroups
   *      summary: Update an existing taxonomy skill group by replacing it.
   *      description: Update an existing taxonomy skill group in a specific taxonomy model by replacing it.
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
   *               $ref: '#/components/schemas/SkillGroupRequestSchemaPUT'
   *         required: true
   *      responses:
   *         '200':
   *           description: Successfully updated the skill group,
   *           content:
   *             application/json:
   *               schema:
   *                  $ref: '#/components/schemas/SkillGroupResponseSchemaPUT'
   *         '400':
   *           description: |
   *             Failed to update the skill group. Additional information can be found in the response body.
   *           content:
   *             application/json:
   *                schema:
   *                  $ref: '#/components/schemas/PUTSkillGroup400ErrorSchema'
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
  async put(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const parsedRequestResult = parseAndValidatePUTRequest(event);
    if ("statusCode" in parsedRequestResult) {
      return parsedRequestResult;
    }
    const payload = parsedRequestResult;

    const params = extractAndValidateIdParams(event, Routes.SKILL_GROUP_ROUTE);
    if ("statusCode" in params) {
      return params;
    }

    if (payload.modelId !== params.modelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        SkillGroupAPISpecs.SkillGroup.PUT.Errors.Response.Status400.ErrorCodes.INVALID_MODEL_ID,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${params.modelId}`
      );
    }

    const spec: IUpdateSkillGroupSpec = {
      originUri: payload.originUri,
      code: payload.code,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      description: payload.description,
      scopeNote: payload.scopeNote,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
    };

    try {
      const service = getServiceRegistry().skillGroup;
      const updatedSkillGroup = await service.update(params.id, params.modelId, spec);
      if (!updatedSkillGroup) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillGroupAPISpecs.SkillGroup.PUT.Errors.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
          "Skill group not found",
          `No skill group found with id: ${params.id}`
        );
      }
      return responseJSON(StatusCodes.OK, buildPUTResponse(updatedSkillGroup, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to update skill group:", error);

      if (error instanceof SkillGroupModelValidationError) {
        switch (error.code) {
          case ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              SkillGroupAPISpecs.SkillGroup.PUT.Errors.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              SkillGroupAPISpecs.SkillGroup.PUT.Errors.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot update skill groups in a released model",
              ""
            );
          case ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillGroupAPISpecs.SkillGroup.PUT.Errors.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_SKILL_GROUP,
              "Failed to fetch the model details from the DB",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillGroupAPISpecs.SkillGroup.PUT.Errors.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_SKILL_GROUP,
              "Failed to update the skill group in the DB",
              ""
            );
        }
      }

      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillGroupAPISpecs.SkillGroup.PUT.Errors.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_SKILL_GROUP,
        "Failed to update the skill group in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillGroupPUTController().put(event);
};
