import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, response, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildDetailResponse } from "./response";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "../../_shared/params";
import { resolveLanguageFromModelResult } from "../../_shared/resolveLanguageFromModelResult";

export class OccupationDetailController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}:
   *   get:
   *    operationId: GETOccupationById
   *    tags:
   *      - occupations
   *    summary: Get a single occupation by its ID in a taxonomy model.
   *    description: Retrieve a single occupation by its ID in a specific taxonomy model.
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
   *      - in: header
   *        name: Accept-Language
   *        required: false
   *        schema:
   *          type: string
   *          example: "fr, en;q=0.9"
   *        description: >
   *          Preferred response language. The server picks the best match from the model's available languages
   *          and falls back to the default language if none match.
   *    responses:
   *      '200':
   *        description: Successfully retrieved the occupation.
   *        headers:
   *          Content-Language:
   *            schema:
   *              type: string
   *              example: "fr"
   *            description: The language of the response body.
   *          Vary:
   *            schema:
   *              type: string
   *              example: "Accept-Language"
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OccupationResponseSchemaPOST'
   *      '400':
   *        description: |
   *          Failed to retrieve the occupation. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Occupation not found.
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
      const params = extractAndValidateIdParams(event, Routes.OCCUPATION_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      const service = getServiceRegistry().occupation;
      const validationResult = await service.validateModelForOccupation(params.modelId);
      const langResult = resolveLanguageFromModelResult(event, validationResult, params.modelId);
      if ("statusCode" in langResult) return langResult;
      const { languageConfig } = langResult;
      const occupation = await service.findById(params.id, languageConfig.dbKeyName);
      if (!occupation) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.GET.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "occupation not found",
          `No occupation found with id: ${params.id}`
        );
      }
      return response(StatusCodes.OK, buildDetailResponse(occupation, getResourcesBaseUrl()), {
        "Content-Type": "application/json",
        "Content-Language": languageConfig.shortCode,
        Vary: "Accept-Language",
      });
    } catch (error: unknown) {
      errorLoggerInstance.logError(
        "Failed to retrieve the occupation from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
        "Failed to retrieve the occupation from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationDetailController().get(event);
};
