import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildParentResponse } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForOccupationValidationErrorCode } from "esco/occupations/services/occupation.service.types";
import {
  ParentForOccupationValidationErrorCode,
  OccupationParentValidationError,
} from "esco/occupationHierarchy/occupationHierarchy.service.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "esco/occupations/_shared/params";

export class OccupationParentPostController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}/parent:
   *   post:
   *    operationId: POSTOccupationParentById
   *    tags:
   *      - occupations
   *    summary: Link an occupation parent.
   *    description: Establish or update the parent relationship for a specific occupation in a specific taxonomy model.
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
   *          description: The unique ID of the child occupation.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/OccupationParentRequestSchemaPOST'
   *       required: true
   *    responses:
   *      '201':
   *        description: Successfully linked the occupation parent.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/OccupationResponseSchemaGETParent'
   *      '400':
   *        description: |
   *          Failed to link the parent. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Occupation or parent not found.
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
      const pathParamsResult = extractAndValidateIdParams(event, Routes.OCCUPATION_PARENT_ROUTE);
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
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_PARENT,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
          "Cannot modify a released model",
          ""
        );
      }

      // 4. Update the parent entity via service
      const hierarchyService = getServiceRegistry().occupationHierarchy;
      let transformedParent;
      try {
        const childOccupation = await service.findById(params.id);
        if (!childOccupation || childOccupation.modelId !== params.modelId) {
          throw new OccupationParentValidationError(ParentForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND);
        }
        const childType =
          childOccupation.occupationType as unknown as import("esco/occupationHierarchy/occupationHierarchy.types").OccupationHierarchyChildType;
        const parentType =
          payload.objectType as unknown as import("esco/occupationHierarchy/occupationHierarchy.types").OccupationHierarchyParentType;
        transformedParent = await hierarchyService.setParent(
          params.modelId,
          params.id,
          childType,
          payload.id,
          parentType
        );
      } catch (error: unknown) {
        if (error instanceof OccupationParentValidationError) {
          if (error.code === ParentForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND) {
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationAPISpecs.Occupation.Parent.POST.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
              "Child occupation not found",
              `No occupation found with id: ${params.id} in model: ${params.modelId}`
            );
          }
          if (error.code === ParentForOccupationValidationErrorCode.PARENT_NOT_FOUND) {
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationAPISpecs.Occupation.Parent.POST.Errors.Status404.ErrorCodes.PARENT_NOT_FOUND,
              "Parent not found",
              `No parent of type ${payload.objectType} found with id: ${payload.id} in model: ${params.modelId}`
            );
          }
          if (error.code === ParentForOccupationValidationErrorCode.INVALID_PARENT_TYPE) {
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.Occupation.Parent.POST.Errors.Status400.ErrorCodes.INVALID_PARENT_TYPE,
              "Invalid parent-child type relationship",
              ""
            );
          }
          if (error.code === ParentForOccupationValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT) {
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.Occupation.Parent.POST.Errors.Status400.ErrorCodes.PARENT_CHILD_CODE_INCONSISTENT,
              "Parent and child codes are inconsistent",
              ""
            );
          }
        }
        throw error;
      }

      return responseJSON(StatusCodes.CREATED, buildParentResponse(transformedParent, getResourcesBaseUrl()));
    } catch (error: unknown) {
      errorLoggerInstance.logError(
        "Failed to link occupation parent in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Occupation.Parent.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_PARENT,
        "Failed to link occupation parent in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationParentPostController().post(event);
};
