import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";

import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildPOSTResponse } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { INewOccupationSpecWithoutImportId } from "../_shared/occupation.types";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "../services/occupation.service.types";
import { extractAndValidateModelIdParam } from "../_shared/params";

export class OccupationPostController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations:
   *    post:
   *      operationId: POSTOccupation
   *      tags:
   *        - occupations
   *      summary: Create a new taxonomy occupation.
   *      description: Create a new taxonomy occupation in a specific taxonomy model.
   *      security:
   *       - api_key: []
   *       - jwt_auth: []
   *      parameters:
   *        - in: path
   *          name: modelId
   *          required: true
   *          schema:
   *            $ref: '#/components/schemas/OccupationRequestParamSchemaGET/properties/modelId'
   *      requestBody:
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OccupationRequestSchemaPOST'
   *         required: true
   *      responses:
   *         '201':
   *           description: Successfully created the occupation,
   *           content:
   *             application/json:
   *               schema:
   *                  $ref: '#/components/schemas/OccupationResponseSchemaPOST'
   *         '400':
   *           description: |
   *             Failed to create the occupation. Additional information can be found in the response body.
   *           content:
   *             application/json:
   *                schema:
   *                  $ref: '#/components/schemas/POSTOccupation400ErrorSchema'
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
  async post(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const parsedRequestResult = parseAndValidatePOSTRequest(event);
    if ("statusCode" in parsedRequestResult) {
      return parsedRequestResult;
    }
    const payload = parsedRequestResult;

    const params = extractAndValidateModelIdParam(event, Routes.OCCUPATIONS_ROUTE);
    if ("statusCode" in params) {
      return params;
    }

    if (payload.modelId !== params.modelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        OccupationAPISpecs.POST.Errors.Status400.ErrorCodes.INVALID_MODEL_ID,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${params.modelId}`
      );
    }

    const newOccupationSpec: INewOccupationSpecWithoutImportId = {
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
      const newOccupation = await service.create(newOccupationSpec);
      return responseJSON(StatusCodes.CREATED, buildPOSTResponse(newOccupation, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to create occupation:", error);

      if (error instanceof OccupationModelValidationError) {
        switch (error.code) {
          case ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationAPISpecs.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationAPISpecs.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
              "Failed to fetch the model details from the DB",
              ""
            );
          case ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.POST.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot add occupations to a released model",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationAPISpecs.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
              "Failed to create the occupation in the DB",
              ""
            );
        }
      } else {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
          "Failed to create the occupation in the DB",
          ""
        );
      }
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationPostController().post(event);
};
