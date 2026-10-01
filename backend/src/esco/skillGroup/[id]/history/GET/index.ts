import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import SkillGroupDetailAPISpecs from "api-specifications/esco/skillGroup/[id]";
import ErrorAPISpecs from "api-specifications/error";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance } from "validator";
import { errorResponse, errorResponseGET, response, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ISkillGroupService } from "esco/skillGroup/services/skillGroup.service.type";
import { getSkillGroupHistoryPathParameters } from "./query";
import { buildHistoryResponse } from "./response";
import { resolveSkillGroupReadLanguage } from "esco/skillGroup/_shared/resolveReadLanguage";

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
   *       description: Successfully retrieved the skill group history.
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

      const readLanguage = resolveSkillGroupReadLanguage(
        event,
        await this.skillGroupService.validateModelForSkillGroup(requestPathParameter.modelId),
        requestPathParameter.modelId,
        {
          modelNotFound: SkillGroupAPISpecs.SkillGroup.History.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          dbFailedToRetrieve:
            SkillGroupAPISpecs.SkillGroup.History.GET.Enums.Response.Status500.ErrorCodes
              .DB_FAILED_TO_RETRIEVE_SKILL_GROUP_HISTORY,
        }
      );
      if ("statusCode" in readLanguage) return readLanguage;

      const history = await this.skillGroupService.getHistory(requestPathParameter.id, readLanguage.language);
      if (history === null) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillGroupAPISpecs.SkillGroup.History.GET.Enums.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
          "Skill group not found",
          `No skill group found with id: ${requestPathParameter.id}`
        );
      }

      return response(StatusCodes.OK, buildHistoryResponse(history), readLanguage.headers);
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
