import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";

import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildPUTResponse } from "./response";
import { parseAndValidatePUTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { IUpdateOccupationSpec } from "../../_shared/occupation.types";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "../../services/occupation.service.types";
import { extractAndValidateIdParams } from "../../_shared/params";

export class OccupationPUTController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}:
   *   put:
   *     operationId: PUTOccupationById
   *     tags:
   *       - occupations
   *     summary: Fully replace an occupation by its ID.
   *     description: Completely replace all mutable fields of an existing occupation in a specific taxonomy model.
   *     security:
   *       - api_key: []
   *       - jwt_auth: []
   *     parameters:
   *       - in: path
   *         name: modelId
   *         required: true
   *         schema:
   *           $ref: '#/components/schemas/OccupationRequestParamSchemaGET/properties/modelId'
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           description: The unique ID of the occupation to replace.
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/OccupationRequestSchemaPUT'
   *       required: true
   *     responses:
   *       '200':
   *         description: Successfully replaced the occupation.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OccupationResponseSchemaPUT'
   *       '400':
   *         description: |
   *           Failed to replace the occupation. Additional information can be found in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PUTOccupation400ErrorSchema'
   *       '401':
   *         $ref: '#/components/responses/UnAuthorizedResponse'
   *       '403':
   *         description: |
   *           The request has not been applied because you don't have the right permissions to access this resource.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AllForbidden403ResponseSchema'
   *       '404':
   *         description: Occupation or model not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PUTOccupation404ErrorSchema'
   *       '415':
   *         description: |
   *           The request is not supported because the media type is not acceptable.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AllContentType415ResponseSchema'
   *       '500':
   *         description: |
   *           The server encountered an unexpected condition.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/All500ResponseSchema'
   *
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async put(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const parsedRequestResult = parseAndValidatePUTRequest(event);
    if ("statusCode" in parsedRequestResult) {
      return parsedRequestResult;
    }
    const payload = parsedRequestResult;

    const params = extractAndValidateIdParams(event, Routes.OCCUPATION_ROUTE);
    if ("statusCode" in params) {
      return params;
    }

    if (payload.modelId !== params.modelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        OccupationAPISpecs.Occupation.PUT.Errors.Status400.ErrorCodes.INVALID_MODEL_ID,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${params.modelId}`
      );
    }

    const spec: IUpdateOccupationSpec = {
      originUri: payload.originUri,
      code: payload.code,
      description: payload.description,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      occupationType:
        payload.occupationType === OccupationAPISpecs.Enums.OccupationType.ESCOOccupation
          ? ObjectTypes.ESCOOccupation
          : ObjectTypes.LocalOccupation,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
      occupationGroupCode: payload.occupationGroupCode,
      definition: payload.definition,
      scopeNote: payload.scopeNote,
      regulatedProfessionNote: payload.regulatedProfessionNote,
      isLocalized: payload.isLocalized,
    };

    try {
      const service = getServiceRegistry().occupation;
      const updatedOccupation = await service.update(params.id, params.modelId, spec);
      if (!updatedOccupation) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Occupation.PUT.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "Occupation not found",
          `No occupation found with id: ${params.id}`
        );
      }
      return responseJSON(StatusCodes.OK, buildPUTResponse(updatedOccupation, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to update occupation:", error);

      if (error instanceof OccupationModelValidationError) {
        switch (error.code) {
          case ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationAPISpecs.Occupation.PUT.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.Occupation.PUT.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot update occupations in a released model",
              ""
            );
          case ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationAPISpecs.Occupation.PUT.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION,
              "Failed to fetch the model details from the DB",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationAPISpecs.Occupation.PUT.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION,
              "Failed to update the occupation in the DB",
              ""
            );
        }
      } else {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Occupation.PUT.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION,
          "Failed to update the occupation in the DB",
          ""
        );
      }
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationPUTController().put(event);
};
