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
import { ModelForSkillGroupValidationErrorCode } from "../../_shared/skillGroup.types";
import { ISkillGroupService } from "../../services/skillGroup.service.type";
import { getSkillGroupDetailPathParameters } from "./query";
import { transform } from "./response";

export class SkillGroupDetailController {
  private readonly skillGroupService: ISkillGroupService;

  constructor() {
    this.skillGroupService = getServiceRegistry().skillGroup;
  }

  /**
   * @openapi
   *
   * /models/{modelId}/skillGroups/{id}:
   *  get:
   *   operationId: GETSkillGroupById
   *   tags:
   *    - skillGroups
   *   summary: Get an skill group by its identifier in a taxonomy model.
   *   description: Retrieve an skill group by its unique identifier in a specific taxonomy model.
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
   *       description: Successfully retrieved the skill group.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SkillGroupResponseSchemaGETById'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Skill group not found.
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
  async getSkillGroup(event: APIGatewayProxyEvent) {
    try {
      const requestPathParameter = getSkillGroupDetailPathParameters(event.path);
      const validatePathFunction = ajvInstance.getSchema(
        SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload.$id as string
      ) as ValidateFunction<SkillGroupDetailAPISpecs.Types.Param.Payload>;

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
      const validationResult = await this.skillGroupService.validateModelForSkillGroup(requestPathParameter.modelId);
      if (validationResult === ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillGroupDetailAPISpecs.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      const skillGroup = await this.skillGroupService.findById(requestPathParameter.id);
      if (!skillGroup) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillGroupDetailAPISpecs.GET.Enums.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND,
          "skill group not found",
          `No skill group found with id: ${requestPathParameter.id}`
        );
      }
      return responseJSON(StatusCodes.OK, transform(skillGroup, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to get skill group by id:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the skill group from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
        "Failed to retrieve the skill group from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillGroupDetailController().getSkillGroup(event);
};
