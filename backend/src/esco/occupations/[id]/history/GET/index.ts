import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildHistoryResponse } from "./response";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForOccupationValidationErrorCode } from "../../../services/occupation.service.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "../../../_shared/params";

export class OccupationHistoryController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}/history:
   *   get:
   *    operationId: GETOccupationHistoryById
   *    tags:
   *      - occupations
   *    summary: Get the model history of an occupation in a taxonomy model.
   *    description: |
   *      Retrieve the list of taxonomy models the occupation appeared in, based on its UUIDHistory.
   *      Each entry is the full model information for a model the occupation was part of.
   *      UUIDs in the history that no longer resolve to an existing model are omitted.
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
   *          description: The unique ID of the occupation.
   *    responses:
   *      '200':
   *        description: Successfully retrieved the occupation history.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OccupationResponseSchemaGETHistory'
   *      '400':
   *        description: |
   *          Failed to retrieve the occupation history. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Occupation or model not found.
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
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async get(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const params = extractAndValidateIdParams(event, Routes.OCCUPATION_HISTORY_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      const service = getServiceRegistry().occupation;
      // The occupation's own model must exist, but unlike write operations a released model is valid here:
      // the history intentionally includes released models, so MODEL_IS_RELEASED (and null) are accepted.
      const validationResult = await service.validateModelForOccupation(params.modelId);
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.GET.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const history = await service.getHistory(params.id);
      if (history === null) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.GET.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "occupation not found",
          `No occupation found with id: ${params.id}`
        );
      }

      return responseJSON(StatusCodes.OK, buildHistoryResponse(history, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to get occupation history:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the occupation history from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
        "Failed to retrieve the occupation history from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationHistoryController().get(event);
};
