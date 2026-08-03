import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import AuthAPISpecs from "api-specifications/auth";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { RoleRequired } from "auth/authorizer";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  IPartialUpdateOccupationGroupSpec,
  ModelForOccupationGroupValidationErrorCode,
} from "esco/occupationGroup/_shared/OccupationGroup.types";
import { OccupationGroupModelValidationError } from "esco/occupationGroup/services/occupationGroup.service.type";
import { Routes } from "routes.constant";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { extractAndValidateIdParams } from "../../_shared/params";
import { parseAndValidatePATCHRequest } from "./request";
import { buildPATCHResponse } from "./response";

export class OccupationGroupPATCHController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups/{id}:
   *    patch:
   *      operationId: PATCHOccupationGroup
   *      tags:
   *        - occupationGroups
   *      summary: Update an existing taxonomy occupation group.
   *      description: Update an existing taxonomy occupation group in a specific taxonomy model.
   *      security:
   *       - api_key: []
   *       - jwt_auth: []
   *      parameters:
   *        - in: path
   *          name: modelId
   *          required: true
   *          schema:
   *            $ref: '#/components/schemas/OccupationGroupRequestByIdParamSchemaGET/properties/modelId'
   *        - in: path
   *          name: id
   *          required: true
   *          schema:
   *            $ref: '#/components/schemas/OccupationGroupRequestByIdParamSchemaGET/properties/id'
   *      requestBody:
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OccupationGroupRequestSchemaPATCH'
   *         required: true
   *      responses:
   *         '200':
   *           description: Successfully updated the occupation group,
   *           content:
   *             application/json:
   *               schema:
   *                  $ref: '#/components/schemas/OccupationGroupResponseSchemaPATCH'
   *         '400':
   *           description: |
   *             Failed to update the occupation group. Additional information can be found in the response body.
   *           content:
   *             application/json:
   *                schema:
   *                  $ref: '#/components/schemas/PATCHOccupationGroup400ErrorSchema'
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

    const params = extractAndValidateIdParams(event, Routes.OCCUPATION_GROUP_ROUTE);
    if ("statusCode" in params) {
      return params;
    }

    if (payload.modelId !== undefined && payload.modelId !== params.modelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status400.ErrorCodes.INVALID_MODEL_ID,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${params.modelId}`
      );
    }

    const spec: IPartialUpdateOccupationGroupSpec = {};
    if (payload.originUri !== undefined) spec.originUri = payload.originUri;
    if (payload.code !== undefined) spec.code = payload.code;
    if (payload.preferredLabel !== undefined) spec.preferredLabel = payload.preferredLabel;
    if (payload.altLabels !== undefined) spec.altLabels = payload.altLabels;
    if (payload.description !== undefined) spec.description = payload.description;
    if (payload.modelId !== undefined) spec.modelId = payload.modelId;
    if (payload.UUIDHistory !== undefined) spec.UUIDHistory = payload.UUIDHistory;
    if (payload.groupType !== undefined) {
      spec.groupType =
        payload.groupType === OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup
          ? ObjectTypes.ISCOGroup
          : ObjectTypes.LocalGroup;
    }

    try {
      const service = getServiceRegistry().occupationGroup;
      const updatedOccupationGroup = await service.patch(params.id, params.modelId, spec);
      if (!updatedOccupationGroup) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status404.ErrorCodes.OCCUPATION_GROUP_NOT_FOUND,
          "Occupation group not found",
          `No occupation group found with id: ${params.id}`
        );
      }
      return responseJSON(StatusCodes.OK, buildPATCHResponse(updatedOccupationGroup, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to patch occupation group:", error);

      if (error instanceof OccupationGroupModelValidationError) {
        switch (error.code) {
          case ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status400.ErrorCodes
                .UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot update occupation groups in a released model",
              ""
            );
          case ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status500.ErrorCodes
                .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
              "Failed to fetch the model details from the DB",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status500.ErrorCodes
                .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
              "Failed to update the occupation group in the DB",
              ""
            );
        }
      }

      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status500.ErrorCodes
          .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
        "Failed to update the occupation group in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationGroupPATCHController().patch(event);
};
