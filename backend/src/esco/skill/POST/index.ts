import type { APIGatewayProxyEvent } from "aws-lambda";
import type { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes, errorResponsePOST } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { parseAndValidatePOSTRequest } from "./request";
import { buildPOSTResponse } from "./response";
import { extractAndValidateModelIdParam } from "esco/skill/_shared/params";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import {
  INewSkillSpecWithoutImportId,
  ModelForSkillValidationErrorCode,
  SkillType,
  ReuseLevel,
} from "esco/skill/_shared/skill.types";
import { SkillModelValidationError } from "esco/skill/services/skill.service.types";
import { getResourcesBaseUrl } from "server/config/config";

export class SkillPostController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills:
   *    post:
   *      operationId: POSTSkill
   *      tags:
   *        - skills
   *      summary: Create a new taxonomy skill.
   *      description: Create a new taxonomy skill in a specific taxonomy model.
   *      security:
   *       - api_key: []
   *       - jwt_auth: []
   *      parameters:
   *        - in: path
   *          name: modelId
   *          required: true
   *          schema:
   *            $ref: '#/components/schemas/SkillRequestParamSchemaPOST/properties/modelId'
   *      requestBody:
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SkillRequestSchemaPOST'
   *         required: true
   *      responses:
   *         '201':
   *           description: Successfully created the skill,
   *           content:
   *             application/json:
   *               schema:
   *                  $ref: '#/components/schemas/SkillResponseSchemaPOST'
   *         '400':
   *           description: |
   *             Failed to create the skill. Additional information can be found in the response body.
   *           content:
   *             application/json:
   *                schema:
   *                  $ref: '#/components/schemas/POSTSkill400ErrorSchema'
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
  async post(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const params = extractAndValidateModelIdParam(event, Routes.SKILLS_ROUTE);
    if ("statusCode" in params) {
      return params;
    }

    const payload = parseAndValidatePOSTRequest(event);
    if ("statusCode" in payload) {
      return payload;
    }

    const newSkillSpec: INewSkillSpecWithoutImportId = {
      modelId: params.modelId,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      description: payload.description,
      definition: payload.definition,
      scopeNote: payload.scopeNote,
      originUri: payload.originUri,
      UUIDHistory: payload.UUIDHistory,
      skillType: payload.skillType as SkillType,
      reuseLevel: payload.reuseLevel as ReuseLevel,
      isLocalized: payload.isLocalized,
    };

    try {
      const service = getServiceRegistry().skill;
      const newSkill = await service.create(newSkillSpec);
      return responseJSON(StatusCodes.CREATED, buildPOSTResponse(newSkill, getResourcesBaseUrl()));
    } catch (error: unknown) {
      if (error instanceof SkillModelValidationError) {
        switch (error.code) {
          case ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              SkillAPISpecs.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponsePOST(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillAPISpecs.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL,
              "Failed to fetch the model details from the DB",
              ""
            );
          case ModelForSkillValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              SkillAPISpecs.POST.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot add skills to a released model",
              ""
            );
          default:
            return errorResponsePOST(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillAPISpecs.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL,
              "Failed to create the skill in the DB",
              ""
            );
        }
      } else {
        return errorResponsePOST(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillAPISpecs.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL,
          "Failed to create the skill in the DB",
          ""
        );
      }
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillPostController().post(event);
};
