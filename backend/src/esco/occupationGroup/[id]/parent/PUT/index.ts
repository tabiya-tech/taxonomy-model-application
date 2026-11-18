import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationGroupParentPUTAPISpecs from "api-specifications/esco/occupationGroup/[id]/parent/PUT";
import { transformParent } from "./response";
import { parseAndValidatePUTRequest } from "./request";
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
import { ObjectTypes } from "esco/common/objectTypes";

export class OccupationGroupParentPUTController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups/{id}/parent:
   *   put:
   *    operationId: PUTOccupationGroupParentById
   *    tags:
   *      - occupationGroups
   *    summary: Set the parent of an occupation group.
   *    description: |
   *      Replace the parent relationship of a specific occupation group in a specific taxonomy model with the
   *      parent given in the payload. When the occupation group has no parent yet, the relationship is created,
   *      so sending the same request repeatedly leaves the group under the same parent.
   *      The body "id" is the identifier of the new parent, while the path "id" is the identifier of the child.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestByIdParamSchemaGET/properties/modelId'
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestByIdParamSchemaGET/properties/id'
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/OccupationGroupParentRequestSchemaPUT'
   *       required: true
   *    responses:
   *      '200':
   *        description: Successfully updated the occupation group parent.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/OccupationGroupParentResponseSchemaPUT'
   *      '400':
   *        description: |
   *          Failed to update the parent. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PUTOccupationGroupParent400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Occupation group, parent or model not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PUTOccupationGroupParent404ErrorSchema'
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
  async put(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const params = extractAndValidateIdParams(event, Routes.OCCUPATION_GROUP_PARENT_ROUTE);
      if ("statusCode" in params) {
        return params;
      }
      const parsedRequestResult = parseAndValidatePUTRequest(event);
      if ("statusCode" in parsedRequestResult) {
        return parsedRequestResult;
      }
      const payload = parsedRequestResult;

      const service = getServiceRegistry().occupationGroup;
      const parentType =
        payload.objectType === OccupationGroupParentPUTAPISpecs.Enums.ObjectTypes.ISCOGroup
          ? ObjectTypes.ISCOGroup
          : ObjectTypes.LocalGroup;

      const parent = await service.setParent({
        childId: params.id,
        parentId: payload.id,
        parentType,
        modelId: params.modelId,
      });

      const transformedParent = transformParent(parent, getResourcesBaseUrl());
      return responseJSON(StatusCodes.OK, transformedParent);
    } catch (error: unknown) {
      if (error instanceof OccupationGroupModelValidationError) {
        switch (error.code) {
          case ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationGroupParentPUTAPISpecs.Enums.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found",
              `No model found with id: ${0}`
            );
          case ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupParentPUTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION_GROUP_PARENT,
              "Failed to fetch the model details from the DB",
              ""
            );
          case ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationGroupParentPUTAPISpecs.Enums.Status400.ErrorCodes.MODEL_IS_RELEASED,
              "Cannot modify a released model",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupParentPUTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION_GROUP_PARENT,
              "Failed to update the occupation group parent in the DB",
              ""
            );
        }
      }

      if (error instanceof SetOccupationGroupParentError) {
        switch (error.code) {
          case SetOccupationGroupParentErrorCode.CHILD_NOT_FOUND:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationGroupParentPUTAPISpecs.Enums.Status404.ErrorCodes.OCCUPATION_GROUP_NOT_FOUND,
              "Child occupation group not found",
              ""
            );
          case SetOccupationGroupParentErrorCode.PARENT_NOT_FOUND:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationGroupParentPUTAPISpecs.Enums.Status404.ErrorCodes.PARENT_NOT_FOUND,
              "Parent not found",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupParentPUTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION_GROUP_PARENT,
              "Failed to update occupation group parent in the DB",
              ""
            );
        }
      }

      console.error("Failed to update occupation group parent:", error);
      errorLoggerInstance.logError(
        "Failed to update occupation group parent in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupParentPUTAPISpecs.Enums.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION_GROUP_PARENT,
        "Failed to update occupation group parent in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationGroupParentPUTController().put(event);
};
