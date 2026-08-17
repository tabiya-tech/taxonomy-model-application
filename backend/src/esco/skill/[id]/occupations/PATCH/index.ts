import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { buildOccupationsResponse } from "./response";
import { parseAndValidatePATCHRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "../../../_shared/params";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { SignallingValueLabel } from "esco/common/objectTypes";
import {
  OccupationSkillValidationError,
  SkillForOccupationValidationErrorCode,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.service.types";

export class SkillOccupationsPATCHController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}/occupations:
   *   patch:
   *    operationId: PATCHSkillOccupationsById
   *    tags:
   *      - skills
   *    summary: Update a skill occupation relation.
   *    description: Update a requirement relation between an occupation and a skill in a specific taxonomy model.
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
   *          description: The unique ID of the required skill.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/SkillOccupationsRequestSchemaPATCH'
   *       required: true
   *    responses:
   *      '200':
   *        description: Successfully updated the skill occupation relation.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/SkillOccupationsResponseSchemaPATCH'
   *      '400':
   *        description: |
   *          Failed to update the occupation relation. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PATCHSkillOccupations400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Skill, occupation, or model not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PATCHSkillOccupations404ErrorSchema'
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
  async patch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // 1. Parse and validate path parameters
      const params = extractAndValidateIdParams(event, Routes.SKILL_OCCUPATIONS_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      // 2. Parse and validate request body
      const parsedRequestResult = parseAndValidatePATCHRequest(event);
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
          SkillAPISpecs.Skill.Occupations.PATCH.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillAPISpecs.Skill.Occupations.PATCH.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_UPDATE_OCCUPATION_SKILL_RELATION,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.MODEL_IS_RELEASED) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          SkillAPISpecs.Skill.Occupations.PATCH.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
          "Cannot modify a released model",
          ""
        );
      }

      // 4. Delegate to the service layer for validation and persistence
      const relationService = getServiceRegistry().occupationToSkillRelation;
      let occupationWithRelation;
      try {
        occupationWithRelation = await relationService.updateOccupation(
          params.modelId,
          params.id,
          payload.requiringOccupationId,
          (payload.relationType ??
            SkillAPISpecs.Enums.OccupationToSkillRelationType.NONE) as unknown as OccupationToSkillRelationType,
          (payload.signallingValueLabel ?? SignallingValueLabel.NONE) as unknown as SignallingValueLabel,
          payload.signallingValue ?? null
        );
      } catch (error: unknown) {
        if (error instanceof OccupationSkillValidationError) {
          switch (error.code) {
            case SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND:
              return errorResponse(
                StatusCodes.NOT_FOUND,
                SkillAPISpecs.Skill.Occupations.PATCH.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
                "Requiring occupation not found",
                `No occupation found with id: ${payload.requiringOccupationId} in model: ${params.modelId}`
              );
            case SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND:
              return errorResponse(
                StatusCodes.NOT_FOUND,
                SkillAPISpecs.Skill.Occupations.PATCH.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
                "Required skill not found",
                `No skill found with id: ${params.id} in model: ${params.modelId}`
              );
            case SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE:
              return errorResponse(
                StatusCodes.BAD_REQUEST,
                SkillAPISpecs.Skill.Occupations.PATCH.Errors.Status400.ErrorCodes.INVALID_RELATION_TYPE,
                "Invalid relation type provided",
                ""
              );
            case SkillForOccupationValidationErrorCode.INVALID_SIGNALLING_VALUE_LABEL:
              return errorResponse(
                StatusCodes.BAD_REQUEST,
                SkillAPISpecs.Skill.Occupations.PATCH.Errors.Status400.ErrorCodes.INVALID_SIGNALLING_VALUE_LABEL,
                "Invalid signalling value label provided",
                ""
              );
            case SkillForOccupationValidationErrorCode.RELATION_CODE_INCONSISTENT:
              return errorResponse(
                StatusCodes.BAD_REQUEST,
                SkillAPISpecs.Skill.Occupations.PATCH.Errors.Status400.ErrorCodes.RELATION_CODE_INCONSISTENT,
                "Relation code inconsistent",
                ""
              );
            case SkillForOccupationValidationErrorCode.MUTUALLY_EXCLUSIVE_VALUES:
              return errorResponse(
                StatusCodes.BAD_REQUEST,
                SkillAPISpecs.Skill.Occupations.PATCH.Errors.Status400.ErrorCodes.MUTUALLY_EXCLUSIVE_VALUES,
                "Local occupations cannot have both relationType and signallingValueLabel set",
                ""
              );
          }
        }
        throw error; // Re-throw to be caught by the generic 500 handler
      }

      return responseJSON(StatusCodes.OK, buildOccupationsResponse(occupationWithRelation, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to update skill occupation relation:", error);
      errorLoggerInstance.logError(
        "Failed to update skill occupation relation in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Skill.Occupations.PATCH.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION_SKILL_RELATION,
        "Failed to update skill occupation relation in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillOccupationsPATCHController().patch(event);
};
