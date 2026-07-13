import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillGroupParentsPOSTAPISpecs from "api-specifications/esco/skillGroup/[id]/parents/POST";
import { transformParent } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForSkillGroupValidationErrorCode } from "esco/skillGroup/_shared/skillGroup.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "esco/skillGroup/_shared/params";
import {
  SkillGroupModelValidationError,
  SetSkillGroupParentError,
  SetSkillGroupParentErrorCode,
} from "esco/skillGroup/services/skillGroup.service.type";

export class SkillGroupParentPOSTController {
  /**
   * @openapi
   *
   * /models/{modelId}/skillGroups/{id}/parent:
   *   post:
   *    operationId: POSTSkillGroupParentById
   *    tags:
   *      - skillGroups
   *    summary: Link a skill group parent.
   *    description: Establish or update the parent relationship for a specific skill group in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/SkillGroupRequestParamSchemaGET/properties/modelId'
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: string
   *          description: The unique ID of the child skill group.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/SkillGroupParentRequestSchemaPOST'
   *       required: true
   *    responses:
   *      '201':
   *        description: Successfully linked the skill group parent.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/SkillGroupParentResponseSchemaPOST'
   *      '400':
   *        description: |
   *          Failed to link the parent. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillGroup400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Skill group or parent not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillGroup404ErrorSchema'
   *      '500':
   *        description: |
   *          The server encountered an unexpected condition.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/All500ResponseSchema'
   *
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async post(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const params = extractAndValidateIdParams(event, Routes.SKILL_GROUP_PARENTS_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      const parsedRequestResult = parseAndValidatePOSTRequest(event);
      if ("statusCode" in parsedRequestResult) {
        return parsedRequestResult;
      }
      const payload = parsedRequestResult;

      const service = getServiceRegistry().skillGroup;
      const parent = await service.setParent({
        childId: params.id,
        parentId: payload.parentId,
        parentType: payload.parentType,
        modelId: params.modelId,
      });

      const transformedParent = transformParent(parent, getResourcesBaseUrl());
      return responseJSON(StatusCodes.CREATED, transformedParent);
    } catch (error: unknown) {
      if (error instanceof SkillGroupModelValidationError) {
        switch (error.code) {
          case ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              SkillGroupParentsPOSTAPISpecs.Enums.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found",
              `No model found with id: ${0}`
            );
          case ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillGroupParentsPOSTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP_PARENT,
              "Failed to fetch the model details from the DB",
              ""
            );
          case ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              SkillGroupParentsPOSTAPISpecs.Enums.Status400.ErrorCodes.MODEL_IS_RELEASED,
              "Cannot modify a released model",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillGroupParentsPOSTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP_PARENT,
              "Failed to create the skill group parent in the DB",
              ""
            );
        }
      }

      if (error instanceof SetSkillGroupParentError) {
        switch (error.code) {
          case SetSkillGroupParentErrorCode.CHILD_NOT_FOUND:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              SkillGroupParentsPOSTAPISpecs.Enums.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
              "Child skill group not found",
              ""
            );
          case SetSkillGroupParentErrorCode.PARENT_NOT_FOUND:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              SkillGroupParentsPOSTAPISpecs.Enums.Status404.ErrorCodes.PARENT_NOT_FOUND,
              "Parent not found",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillGroupParentsPOSTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP_PARENT,
              "Failed to link skill group parent in the DB",
              ""
            );
        }
      }

      console.error("Failed to link skill group parent:", error);
      errorLoggerInstance.logError(
        "Failed to link skill group parent in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillGroupParentsPOSTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP_PARENT,
        "Failed to link skill group parent in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillGroupParentPOSTController().post(event);
};
