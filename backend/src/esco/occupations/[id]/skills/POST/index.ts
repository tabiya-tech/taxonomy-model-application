import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildSkillsResponse } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForOccupationValidationErrorCode } from "esco/occupations/services/occupation.service.types";
import {
  SkillForOccupationValidationErrorCode,
  OccupationSkillValidationError,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.service.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "esco/occupations/_shared/params";
import { SignallingValueLabel } from "esco/common/objectTypes";

export class OccupationSkillsPostController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}/skills:
   *   post:
   *    operationId: POSTOccupationSkillsById
   *    tags:
   *      - occupations
   *    summary: Link an occupation skill.
   *    description: Establish or update a requirement relation between an occupation and a skill in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestParamSchemaGET/properties/modelId'
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: string
   *          description: The unique ID of the requiring occupation.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/OccupationSkillsRequestSchemaPOST'
   *       required: true
   *    responses:
   *      '201':
   *        description: Successfully linked the occupation skill.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/OccupationResponseSchemaGETSkills/properties/data/items'
   *      '400':
   *        description: |
   *          Failed to link the occupation skill. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Occupation, skill, or model not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation404ErrorSchema'
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
      const pathParamsResult = extractAndValidateIdParams(event, Routes.OCCUPATION_SKILLS_ROUTE);
      if ("statusCode" in pathParamsResult) {
        return pathParamsResult;
      }
      const params = pathParamsResult;

      // 2. Parse and validate request body
      const parsedRequestResult = parseAndValidatePOSTRequest(event);
      if ("statusCode" in parsedRequestResult) {
        return parsedRequestResult;
      }
      const payload = parsedRequestResult;

      // 3. Validate model state (exists & is not released)
      const service = getServiceRegistry().occupation;
      const validationResult = await service.validateModelForOccupation(params.modelId);
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
          "Cannot modify a released model",
          ""
        );
      }

      // 4. Update the relationship via service
      const relationService = getServiceRegistry().occupationToSkillRelation;
      let transformedSkill;
      try {
        transformedSkill = await relationService.addSkill(
          params.modelId,
          params.id,
          payload.requiredSkillId,
          (payload.relationType ??
            OccupationAPISpecs.Enums.OccupationToSkillRelationType
              .NONE) as unknown as import("esco/occupationToSkillRelation/occupationToSkillRelation.types").OccupationToSkillRelationType,
          payload.signallingValueLabel ?? SignallingValueLabel.NONE,
          payload.signallingValue ?? null
        );
      } catch (error: unknown) {
        if (error instanceof OccupationSkillValidationError) {
          if (error.code === SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND) {
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationAPISpecs.Occupation.Skills.POST.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
              "Requiring occupation not found",
              `No occupation found with id: ${params.id} in model: ${params.modelId}`
            );
          }
          if (error.code === SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND) {
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationAPISpecs.Occupation.Skills.POST.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
              "Required skill not found",
              `No skill found with id: ${payload.requiredSkillId} in model: ${params.modelId}`
            );
          }
          if (error.code === SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE) {
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.INVALID_RELATION_TYPE,
              "Invalid relationType for this occupation type",
              ""
            );
          }
          if (error.code === SkillForOccupationValidationErrorCode.INVALID_SIGNALLING_VALUE_LABEL) {
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.INVALID_SIGNALLING_VALUE_LABEL,
              "Invalid signallingValueLabel for this occupation type",
              ""
            );
          }
          if (error.code === SkillForOccupationValidationErrorCode.RELATION_CODE_INCONSISTENT) {
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.RELATION_CODE_INCONSISTENT,
              "Relation code inconsistent",
              ""
            );
          }
          if (error.code === SkillForOccupationValidationErrorCode.MUTUALLY_EXCLUSIVE_VALUES) {
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.MUTUALLY_EXCLUSIVE_VALUES,
              "relationType and signallingValueLabel cannot both be set at the same time",
              ""
            );
          }
        }
        throw error;
      }

      return responseJSON(StatusCodes.CREATED, buildSkillsResponse(transformedSkill, getResourcesBaseUrl()));
    } catch (error: unknown) {
      errorLoggerInstance.logError(
        "Failed to link occupation skill in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Occupation.Skills.POST.Errors.Status500.ErrorCodes
          .DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
        "Failed to link occupation skill in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationSkillsPostController().post(event);
};
