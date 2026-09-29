import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import OccupationGroupDetailAPISpecs from "api-specifications/esco/occupationGroup/[id]";
import ErrorAPISpecs from "api-specifications/error";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance } from "validator";
import { errorResponse, errorResponseGET, response, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { IOccupationGroupService } from "esco/occupationGroup/services/occupationGroup.service.type";
import { getOccupationGroupHistoryPathParameters } from "./query";
import { buildHistoryResponse } from "./response";
import { resolveLanguageFromModelResult } from "esco/occupationGroup/_shared/resolveLanguageFromModelResult";

export class OccupationGroupHistoryController {
  private readonly occupationGroupService: IOccupationGroupService;

  constructor() {
    this.occupationGroupService = getServiceRegistry().occupationGroup;
  }

  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups/{id}/history:
   *  get:
   *   operationId: GETOccupationGroupHistoryByOccupationGroupId
   *   tags:
   *    - occupationGroups
   *   summary: Get the model history of an occupation group in a taxonomy model.
   *   description: |
   *     Retrieve the list of taxonomy models the occupation group appeared in, based on its UUIDHistory.
   *     Each entry is the full model information for a model the occupation group was part of.
   *     UUIDs in the history that no longer resolve to an existing occupation group are omitted.
   *   security:
   *    - api_key: []
   *    - jwt_auth: []
   *   parameters:
   *    - in: path
   *      name: modelId
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/OccupationGroupRequestByIdParamSchemaGET/properties/modelId'
   *    - in: path
   *      name: id
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/OccupationGroupRequestByIdParamSchemaGET/properties/id'
   *    - in: header
   *      name: Accept-Language
   *      required: false
   *      schema:
   *        type: string
   *        example: "fr, en;q=0.9"
   *      description: >
   *        Preferred response language. The server picks the best match from the model's available languages
   *        and falls back to the default language if none match.
   *   responses:
   *     '200':
   *       description: Successfully retrieved the occupation group history.
   *       headers:
   *         Content-Language:
   *           schema:
   *             type: string
   *             example: "fr"
   *           description: The language of the response body.
   *         Vary:
   *           schema:
   *             type: string
   *             example: "Accept-Language"
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/OccupationGroupResponseSchemaGETHistory'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Occupation group or model not found.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETOccupationGroup404ErrorSchema'
   *     '500':
   *       description: |
   *         The server encountered an unexpected condition.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getOccupationGroupHistory(event: APIGatewayProxyEvent) {
    try {
      const requestPathParameter = getOccupationGroupHistoryPathParameters(event.path);

      const validatePathFunction = ajvInstance.getSchema(
        OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.OccupationGroup.Types.Param.Payload>;

      const isValidPathParameter = validatePathFunction(requestPathParameter);
      if (!isValidPathParameter) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({
            reason: "Invalid modelId or occupationGroup Id",
            path: event.path,
            pathParameters: event.pathParameters,
          })
        );
      }

      // The occupation group's own model must exist, but unlike write operations a released model is valid here:
      // the history intentionally includes released models, so MODEL_IS_RELEASED (and null) are accepted.
      const validationResult = await this.occupationGroupService.validateModelForOccupationGroup(
        requestPathParameter.modelId
      );
      const langResult = resolveLanguageFromModelResult(
        event,
        validationResult,
        requestPathParameter.modelId,
        OccupationGroupAPISpecs.OccupationGroup.History.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_HISTORY
      );
      if ("statusCode" in langResult) return langResult;
      const { languageConfig } = langResult;
      const languageHeaders = {
        "Content-Type": "application/json",
        "Content-Language": languageConfig.shortCode,
        Vary: "Accept-Language",
      };

      const history = await this.occupationGroupService.getHistory(requestPathParameter.id, languageConfig.dbKeyName);
      if (history === null) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.OccupationGroup.History.GET.Enums.Response.Status404.ErrorCodes
            .OCCUPATION_GROUP_NOT_FOUND,
          "Occupation group not found",
          `No occupation group found with id: ${requestPathParameter.id}`
        );
      }

      return response(StatusCodes.OK, buildHistoryResponse(history), languageHeaders);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to get occupation group history:", error);
      errorLoggerInstance.logError("Failed to retrieve the occupation group history from the DB", error.name);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.OccupationGroup.History.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_HISTORY,
        "Failed to retrieve the occupation group history from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationGroupHistoryController().getOccupationGroupHistory(event);
};
