import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import OccupationGroupDetailAPISpecs from "api-specifications/esco/occupationGroup/[id]";
import ErrorAPISpecs from "api-specifications/error";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance } from "validator";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, errorResponseGET, response, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { IOccupationGroupService } from "../../../services/occupationGroup.service.type";
import { getOccupationGroupParentPathParameters } from "./query";
import { transformParent } from "./response";
import { resolveLanguageFromModelResult } from "../../../_shared/resolveLanguageFromModelResult";

export class OccupationGroupParentController {
  private readonly occupationGroupService: IOccupationGroupService;

  constructor() {
    this.occupationGroupService = getServiceRegistry().occupationGroup;
  }

  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups/{id}/parent:
   *  get:
   *   operationId: GETOccupationGroupParentByOccupationGroupId
   *   tags:
   *    - occupationGroups
   *   summary: Get an occupation group's parent by its child occupation group identifier in a taxonomy model.
   *   description: Retrieve an occupation group parent by its unique child occupation group identifier in a specific taxonomy model.
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
   *       description: Successfully retrieved the occupation group parent.
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
   *             $ref: '#/components/schemas/OccupationGroupParentResponseSchemaGET'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Occupation group parent not found.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETOccupationGroupParent404ErrorSchema'
   *     '500':
   *       description: |
   *         The server encountered an unexpected condition.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getParentOccupationGroup(event: APIGatewayProxyEvent) {
    try {
      const requestPathParameter = getOccupationGroupParentPathParameters(event.path);

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
      const validationResult = await this.occupationGroupService.validateModelForOccupationGroup(
        requestPathParameter.modelId
      );
      const langResult = resolveLanguageFromModelResult(
        event,
        validationResult,
        requestPathParameter.modelId,
        OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_PARENT
      );
      if ("statusCode" in langResult) return langResult;
      const { languageConfig } = langResult;
      const languageHeaders = {
        "Content-Type": "application/json",
        "Content-Language": languageConfig.shortCode,
        Vary: "Accept-Language",
      };

      const parentOccupationGroup = await this.occupationGroupService.findParent(
        requestPathParameter.id,
        languageConfig.dbKeyName
      );
      if (!parentOccupationGroup) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Enums.Response.Status404.ErrorCodes
            .OCCUPATION_GROUP_PARENT_NOT_FOUND,
          "Occupation group or parent not found",
          `No occupation group or parent found with occupation group id: ${requestPathParameter.id}`
        );
      }
      return response(StatusCodes.OK, transformParent(parentOccupationGroup, getResourcesBaseUrl()), languageHeaders);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to get parent occupation group:", error);
      errorLoggerInstance.logError("Failed to retrieve the parent occupation group from the DB", error.name);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_PARENT,
        "Failed to retrieve the parent occupation group from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationGroupParentController().getParentOccupationGroup(event);
};
