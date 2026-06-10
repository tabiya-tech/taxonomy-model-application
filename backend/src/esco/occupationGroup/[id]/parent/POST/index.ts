import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationGroupPOSTParentAPISpecs from "api-specifications/esco/occupationGroup/[id]/parent/POST";
import { transformParent } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForOccupationGroupValidationErrorCode } from "esco/occupationGroup/_shared/OccupationGroup.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "esco/occupationGroup/_shared/params";
import {
  OccupationGroupModelValidationError,
  SetOccupationGroupParentError,
  SetOccupationGroupParentErrorCode,
} from "esco/occupationGroup/services/occupationGroup.service.type";

export class OccupationGroupParentPOSTController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups/{id}/parent:
   *   post:
   *    operationId: POSTOccupationGroupParentById
   *    tags:
   *      - occupationGroups
   *    summary: Link an occupation group parent.
   *    description: Establish or update the parent relationship for a specific occupation group in a specific taxonomy model.
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
   *          description: The unique ID of the child occupation group.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/OccupationGroupParentRequestSchemaPOST'
   *       required: true
   *    responses:
   *      '201':
   *        description: Successfully linked the occupation group parent.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/OccupationGroupParentResponseSchemaGET'
   *      '400':
   *        description: |
   *          Failed to link the parent. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupationGroup400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Occupation or parent not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupationGroup404ErrorSchema'
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
      const params = extractAndValidateIdParams(event, Routes.OCCUPATION_GROUP_PARENT_ROUTE);
      if ("statusCode" in params) {
        return params;
      }
      const parsedRequestResult = parseAndValidatePOSTRequest(event);
      if ("statusCode" in parsedRequestResult) {
        return parsedRequestResult;
      }
      const payload = parsedRequestResult;

      const service = getServiceRegistry().occupationGroup;
      const parent = await service.setParent({
        childId: params.id,
        parentId: payload.parentId,
        parentType: payload.parentType,
        modelId: params.modelId,
      });

      const transformedParent = transformParent(parent, getResourcesBaseUrl());
      return responseJSON(StatusCodes.CREATED, transformedParent);
    } catch (error: unknown) {
      if (error instanceof OccupationGroupModelValidationError) {
        switch (error.code) {
          case ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationGroupPOSTParentAPISpecs.Enums.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found",
              `No model found with id: ${0}`
            );
          case ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupPOSTParentAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP_PARENT,
              "Failed to fetch the model details from the DB",
              ""
            );
          case ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationGroupPOSTParentAPISpecs.Enums.Status400.ErrorCodes.MODEL_IS_RELEASED,
              "Cannot modify a released model",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupPOSTParentAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP_PARENT,
              "Failed to create the occupation group parent in the DB",
              ""
            );
        }
      }

      if (error instanceof SetOccupationGroupParentError) {
        switch (error.code) {
          case SetOccupationGroupParentErrorCode.CHILD_NOT_FOUND:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationGroupPOSTParentAPISpecs.Enums.Status404.ErrorCodes.OCCUPATION_GROUP_NOT_FOUND,
              "Child occupation group not found",
              ""
            );
          case SetOccupationGroupParentErrorCode.PARENT_NOT_FOUND:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationGroupPOSTParentAPISpecs.Enums.Status404.ErrorCodes.PARENT_NOT_FOUND,
              "Parent not found",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupPOSTParentAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP_PARENT,
              "Failed to link occupation group parent in the DB",
              ""
            );
        }
      }

      console.error("Failed to link occupation parent:", error);
      errorLoggerInstance.logError(
        "Failed to link occupation parent in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupPOSTParentAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP_PARENT,
        "Failed to link occupation group parent in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationGroupParentPOSTController().post(event);
};
