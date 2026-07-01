import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import SkillGroupDetailAPISpecs from "api-specifications/esco/skillGroup/[id]";
import ErrorAPISpecs from "api-specifications/error";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance } from "validator";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ModelForSkillGroupValidationErrorCode } from "../../../_shared/skillGroup.types";
import { ISkillGroupService } from "../../../services/skillGroup.service.type";
import { getSkillGroupHistoryPathParameters } from "./query";
import { buildHistoryResponse } from "./response";

export class SkillGroupHistoryController {
  private readonly skillGroupService: ISkillGroupService;

  constructor() {
    this.skillGroupService = getServiceRegistry().skillGroup;
  }

  /**
   * @openapi
   *
   * /models/{modelId}/skillGroups/{id}/history:
   *  get:
   *   operationId: GETSkillGroupHistoryById
   *   tags:
   *    - skillGroups
   *   summary: Get the model history of a skill group in a taxonomy model.
   *   description: |
   *     Retrieve the list of taxonomy models the skill group appeared in, based on its UUIDHistory.
   *     Each entry is the full model information for a model the skill group was part of.
   *     UUIDs in the history that no longer resolve to an existing skill group are omitted.
   *   security:
   *    - api_key: []
   *    - jwt_auth: []
   *   parameters:
   *    - in: path
   *      name: modelId
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/SkillGroupRequestByIdParamSchemaGET/properties/modelId'
   *    - in: path
   *      name: id
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/SkillGroupRequestByIdParamSchemaGET/properties/id'
   *   responses:
   *     '200':
   *       description: Successfully retrieved the skill group history.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SkillGroupResponseSchemaGETHistory'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Skill group or model not found.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETSkillGroup404ErrorSchema'
   *     '500':
   *       description: |
   *         The server encountered an unexpected condition.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getSkillGroupHistory(event: APIGatewayProxyEvent) {
    try {
      const requestPathParameter = getSkillGroupHistoryPathParameters(event.path);
      const validatePathFunction = ajvInstance.getSchema(
        SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload.$id as string
      ) as ValidateFunction<SkillGroupAPISpecs.Types.GET.Request.Detail.Param.Payload>;

      const isValidPathParameter = validatePathFunction(requestPathParameter);
      if (!isValidPathParameter) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({
            reason: "Invalid modelId or skillGroup Id",
            path: event.path,
            pathParameters: event.pathParameters,
          })
        );
      }

      // The skill group's own model must exist, but unlike write operations a released model is valid here:
      // the history intentionally includes released models, so MODEL_IS_RELEASED (and null) are accepted.
      const validationResult = await this.skillGroupService.validateModelForSkillGroup(requestPathParameter.modelId);
      if (validationResult === ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillGroupAPISpecs.SkillGroup.History.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillGroupAPISpecs.SkillGroup.History.GET.Enums.Response.Status500.ErrorCodes
            .DB_FAILED_TO_RETRIEVE_SKILL_GROUP_HISTORY,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const history = await this.skillGroupService.getHistory(requestPathParameter.id);
      if (history === null) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillGroupAPISpecs.SkillGroup.History.GET.Enums.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
          "Skill group not found",
          `No skill group found with id: ${requestPathParameter.id}`
        );
      }

      return responseJSON(StatusCodes.OK, buildHistoryResponse(history, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to get skill group history:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the skill group history from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillGroupAPISpecs.SkillGroup.History.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_SKILL_GROUP_HISTORY,
        "Failed to retrieve the skill group history from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillGroupHistoryController().getSkillGroupHistory(event);
};
