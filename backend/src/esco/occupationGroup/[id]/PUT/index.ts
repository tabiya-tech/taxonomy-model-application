import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import AuthAPISpecs from "api-specifications/auth";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { RoleRequired } from "auth/authorizer";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  IUpdateOccupationGroupSpec,
  ModelForOccupationGroupValidationErrorCode,
} from "esco/occupationGroup/_shared/OccupationGroup.types";
import { OccupationGroupModelValidationError } from "esco/occupationGroup/services/occupationGroup.service.type";
import { Routes } from "routes.constant";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { extractAndValidateIdParams } from "../../_shared/params";
import { parseAndValidatePUTRequest } from "./request";
import { buildPUTResponse } from "./response";

export class OccupationGroupPUTController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups:
   *    put:
   *      operationId: PUTOccupationGroup
   *      tags:
   *        - occupationGroups
   *      summary: Update an existing taxonomy occupation group by replacing it.
   *      description: Update an existing taxonomy occupation group in a specific taxonomy model by replacing it.
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
   *               $ref: '#/components/schemas/OccupationGroupRequestSchemaPUT'
   *         required: true
   *      responses:
   *         '200':
   *           description: Successfully updated the occupation group,
   *           content:
   *             application/json:
   *               schema:
   *                  $ref: '#/components/schemas/OccupationGroupResponseSchemaPUT'
   *         '400':
   *           description: |
   *             Failed to update the occupation group. Additional information can be found in the response body.
   *           content:
   *             application/json:
   *                schema:
   *                  $ref: '#/components/schemas/PUTOccupationGroup400ErrorSchema'
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

    const params = extractAndValidateIdParams(event, Routes.OCCUPATION_GROUP_ROUTE);
    if ("statusCode" in params) {
      return params;
    }

    if (payload.modelId !== params.modelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status400.ErrorCodes.INVALID_MODEL_ID,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${params.modelId}`
      );
    }

    const spec: IUpdateOccupationGroupSpec = {
      originUri: payload.originUri,
      code: payload.code,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      description: payload.description,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
      groupType:
        payload.groupType === OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup
          ? ObjectTypes.ISCOGroup
          : ObjectTypes.LocalGroup,
    };

    try {
      const service = getServiceRegistry().occupationGroup;
      const updatedOccupationGroup = await service.update(params.id, params.modelId, spec);
      if (!updatedOccupationGroup) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status404.ErrorCodes.OCCUPATION_GROUP_NOT_FOUND,
          "Occupation group not found",
          `No occupation group found with id: ${params.id}`
        );
      }
      return responseJSON(StatusCodes.OK, buildPUTResponse(updatedOccupationGroup, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to update occupation group:", error);

      if (error instanceof OccupationGroupModelValidationError) {
        switch (error.code) {
          case ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status400.ErrorCodes
                .UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot update occupation groups in a released model",
              ""
            );
          case ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status500.ErrorCodes
                .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
              "Failed to fetch the model details from the DB",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status500.ErrorCodes
                .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
              "Failed to update the occupation group in the DB",
              ""
            );
        }
      }

      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status500.ErrorCodes
          .DB_FAILED_TO_UPDATE_OCCUPATION_GROUP,
        "Failed to update the occupation group in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationGroupPUTController().put(event);
};
