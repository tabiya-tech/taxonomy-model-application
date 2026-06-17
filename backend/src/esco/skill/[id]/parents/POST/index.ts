import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { buildParentResponse } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "../../../_shared/params";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  ParentForSkillValidationErrorCode,
  SkillParentValidationError,
} from "esco/skillHierarchy/skillHierarchy.service.types";

export class SkillParentsPostController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}/parents:
   *   post:
   *    operationId: POSTSkillParentsById
   *    tags:
   *      - skills
   *    summary: Link a skill parent.
   *    description: Establish a parent relationship for a specific skill in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestParamSchemaGET/properties/modelId'
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: string
   *          description: The unique ID of the child skill.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/SkillParentsRequestSchemaPOST'
   *       required: true
   *    responses:
   *      '201':
   *        description: Successfully linked the skill parent.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/SkillParentsResponseSchemaPOST'
   *      '400':
   *        description: |
   *          Failed to link the parent. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillParents400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Skill, parent, or model not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillParents404ErrorSchema'
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
      // 1. Parse and validate path parameters
      const params = extractAndValidateIdParams(event, Routes.SKILL_PARENTS_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      // 2. Parse and validate request body
      const parsedRequestResult = parseAndValidatePOSTRequest(event);
      if ("statusCode" in parsedRequestResult) {
        return parsedRequestResult;
      }
      const payload = parsedRequestResult;

      // 3. Validate model state (exists & is not released)
      const service = getServiceRegistry().skill;
      const validationResult = await service.validateModelForSkill(params.modelId);
      if (validationResult === ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.Skill.Parents.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillAPISpecs.Skill.Parents.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_PARENT_RELATION,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.MODEL_IS_RELEASED) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          SkillAPISpecs.Skill.Parents.POST.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
          "Cannot modify a released model",
          ""
        );
      }

      // 4. Delegate to Service layer
      const skillHierarchyService = getServiceRegistry().skillHierarchy;

      const createdParent = await skillHierarchyService.setParent(
        params.modelId,
        params.id,
        ObjectTypes.Skill,
        payload.parentId,
        payload.parentType as unknown as ObjectTypes.Skill | ObjectTypes.SkillGroup
      );

      return responseJSON(StatusCodes.CREATED, buildParentResponse(createdParent, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to link skill parent:", error);

      if (error instanceof SkillParentValidationError) {
        switch (error.code) {
          case ParentForSkillValidationErrorCode.SKILL_NOT_FOUND:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              SkillAPISpecs.Skill.Parents.POST.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
              "Child skill not found",
              ""
            );
          case ParentForSkillValidationErrorCode.PARENT_NOT_FOUND:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              SkillAPISpecs.Skill.Parents.POST.Errors.Status404.ErrorCodes.PARENT_NOT_FOUND,
              "Parent not found",
              ""
            );
          case ParentForSkillValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              SkillAPISpecs.Skill.Parents.POST.Errors.Status400.ErrorCodes.PARENT_CHILD_CODE_INCONSISTENT,
              "Parent-Child code inconsistency",
              "Child code does not match parent code."
            );
          case ParentForSkillValidationErrorCode.DB_FAILED_TO_CREATE_SKILL_PARENT:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillAPISpecs.Skill.Parents.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_PARENT_RELATION,
              "Failed to link skill parent in the DB",
              ""
            );
        }
      }

      errorLoggerInstance.logError(
        "Failed to link skill parent in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Skill.Parents.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_PARENT_RELATION,
        "Failed to link skill parent in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillParentsPostController().post(event);
};
