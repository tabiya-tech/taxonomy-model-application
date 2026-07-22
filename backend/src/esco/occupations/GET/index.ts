import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildGETResponse } from "./response";
import { parseGETQuery } from "./query";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForOccupationValidationErrorCode } from "../services/occupation.service.types";
import { encodeCursor } from "../_shared/pagination/encodeCursor";
import { extractAndValidateModelIdParam } from "../_shared/params";
import { getResourcesBaseUrl } from "server/config/config";

export class OccupationGetController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations:
   *   get:
   *    operationId: GETOccupations
   *    tags:
   *      - occupations
   *    summary: Get a list of paginated occupations and cursor if there is one in a taxonomy model.
   *    description: Retrieve a list of paginated occupations in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestParamSchemaGET/properties/modelId'
   *      - in: query
   *        name: limit
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestQueryParamSchemaGET/properties/limit'
   *      - in: query
   *        name: cursor
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestQueryParamSchemaGET/properties/cursor'
   *      - in: query
   *        name: query
   *        required: false
   *        description: >
   *          A free-text value to search the occupations by. When set, the endpoint returns the occupations
   *          matching the value on the requested searchFields, ranked by relevance. Released models are searched
   *          with vector embeddings; unreleased models with a case-insensitive regex.
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestQueryParamSchemaGET/properties/query'
   *      - in: query
   *        name: searchFields
   *        required: false
   *        description: >
   *          A comma-separated list of the occupation fields to search on (e.g. 'preferredLabel,description').
   *          Only meaningful together with query. Defaults to 'preferredLabel'.
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestQueryParamSchemaGET/properties/searchFields'
   *    responses:
   *      '200':
   *        description: Successfully retrieved the paginated occupations.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OccupationResponseSchemaGET'
   *      '400':
   *        description: |
   *          Failed to retrieve the occupations. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Occupations not found.
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
      const params = extractAndValidateModelIdParam(event, Routes.OCCUPATIONS_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      const service = getServiceRegistry().occupation;
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

      const queryParams = parseGETQuery(event);
      if ("statusCode" in queryParams) {
        return queryParams;
      }

      // When a search value is provided, delegate to the search path. It takes the opaque cursor verbatim and
      // returns an already-encoded nextCursor (keyset for regex search, relevance offset for vector search), so
      // the controller stays agnostic to the search pagination strategy.
      if (queryParams.searchValue !== undefined) {
        const searchPage = await service.searchPaginated(
          params.modelId,
          queryParams.searchValue,
          queryParams.searchFields,
          event.queryStringParameters?.cursor ?? undefined,
          queryParams.limit
        );
        return responseJSON(
          StatusCodes.OK,
          buildGETResponse(searchPage.items, getResourcesBaseUrl(), queryParams.limit, searchPage.nextCursor)
        );
      }

      let decodedCursorObj: { id: string; createdAt: Date } | undefined = undefined;
      if (event.queryStringParameters?.cursor) {
        // Decode cursor for findPaginated
        const { decodeCursor } = await import("../_shared/pagination/decodeCursor");
        decodedCursorObj = decodeCursor(event.queryStringParameters.cursor);
      }

      const currentPageOccupations = await service.findPaginated(params.modelId, decodedCursorObj, queryParams.limit);

      let nextCursor: string | null = null;
      if (currentPageOccupations?.nextCursor?._id) {
        nextCursor = encodeCursor(currentPageOccupations.nextCursor._id, currentPageOccupations.nextCursor.createdAt);
      }

      return responseJSON(
        StatusCodes.OK,
        buildGETResponse(currentPageOccupations.items, getResourcesBaseUrl(), queryParams.limit, nextCursor)
      );
    } catch (error: unknown) {
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
        "Failed to retrieve the occupations from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationGetController().get(event);
};
