import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";

import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildPATCHResponse } from "./response";
import { parseAndValidatePATCHRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { IPartialUpdateOccupationSpec } from "../../_shared/occupation.types";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "../../services/occupation.service.types";
import { extractAndValidateIdParams } from "../../_shared/params";

export class OccupationPATCHController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}:
   *   patch:
   *     operationId: PATCHOccupationById
   *     tags:
   *       - occupations
   *     summary: Partially update an occupation by its ID.
   *     description: Update one or more fields of an existing occupation in a specific taxonomy model. Only provided fields are updated.
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
   *           description: The unique ID of the occupation to update.
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/OccupationRequestSchemaPATCH'
   *       required: true
   *     responses:
   *       '200':
   *         description: Successfully updated the occupation.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OccupationResponseSchemaPATCH'
   *       '400':
   *         description: |
   *           Failed to update the occupation. Additional information can be found in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PATCHOccupation400ErrorSchema'
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
   *               $ref: '#/components/schemas/PATCHOccupation404ErrorSchema'
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
  async patch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const parsedRequestResult = parseAndValidatePATCHRequest(event);
    if ("statusCode" in parsedRequestResult) {
      return parsedRequestResult;
    }
    const payload = parsedRequestResult;

    const params = extractAndValidateIdParams(event, Routes.OCCUPATION_ROUTE);
    if ("statusCode" in params) {
      return params;
    }

    // Build partial spec — only include fields explicitly present in the payload
    const spec: IPartialUpdateOccupationSpec = {};
    if (payload.code !== undefined) spec.code = payload.code;
    if (payload.occupationGroupCode !== undefined) spec.occupationGroupCode = payload.occupationGroupCode;
    if (payload.preferredLabel !== undefined) spec.preferredLabel = payload.preferredLabel;
    if (payload.originUri !== undefined) spec.originUri = payload.originUri;
    if (payload.altLabels !== undefined) spec.altLabels = payload.altLabels;
    if (payload.definition !== undefined) spec.definition = payload.definition;
    if (payload.description !== undefined) spec.description = payload.description;
    if (payload.regulatedProfessionNote !== undefined) spec.regulatedProfessionNote = payload.regulatedProfessionNote;
    if (payload.scopeNote !== undefined) spec.scopeNote = payload.scopeNote;
    if (payload.modelId !== undefined) spec.modelId = payload.modelId;
    if (payload.UUIDHistory !== undefined) spec.UUIDHistory = payload.UUIDHistory;
    if (payload.isLocalized !== undefined) spec.isLocalized = payload.isLocalized;
    if (payload.occupationType !== undefined) {
      spec.occupationType =
        payload.occupationType === OccupationAPISpecs.Enums.OccupationType.ESCOOccupation
          ? ObjectTypes.ESCOOccupation
          : ObjectTypes.LocalOccupation;
    }

    try {
      const service = getServiceRegistry().occupation;
      const updatedOccupation = await service.patch(params.id, params.modelId, spec);
      if (!updatedOccupation) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Occupation.PATCH.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "Occupation not found",
          `No occupation found with id: ${params.id}`
        );
      }
      return responseJSON(StatusCodes.OK, buildPATCHResponse(updatedOccupation, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to patch occupation:", error);

      if (error instanceof OccupationModelValidationError) {
        switch (error.code) {
          case ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationAPISpecs.Occupation.PATCH.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.Occupation.PATCH.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot update occupations in a released model",
              ""
            );
          case ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationAPISpecs.Occupation.PATCH.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION,
              "Failed to fetch the model details from the DB",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationAPISpecs.Occupation.PATCH.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION,
              "Failed to update the occupation in the DB",
              ""
            );
        }
      } else {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Occupation.PATCH.Errors.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_OCCUPATION,
          "Failed to update the occupation in the DB",
          ""
        );
      }
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationPATCHController().patch(event);
};
