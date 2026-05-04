import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import {
  errorResponse,
  errorResponseGET,
  HTTP_VERBS,
  responseJSON,
  StatusCodes,
  STD_ERRORS_RESPONSES,
} from "server/httpUtils";
import { ajvInstance } from "validator";
import AuthAPISpecs from "api-specifications/auth";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import OccupationGroupDetailAPISpecs from "api-specifications/esco/occupationGroup/[id]";

import { ValidateFunction } from "ajv";
import { transform } from "./transform";
import { getResourcesBaseUrl } from "server/config/config";
import { ModelForOccupationGroupValidationErrorCode } from "./OccupationGroup.types";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import ErrorAPISpecs from "api-specifications/error";
import { pathToRegexp } from "path-to-regexp";
import { parsePath } from "common/parsePath/parsePath";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { IOccupationGroupService } from "./occupationGroupService.type";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { OccupationGroupListController } from "./GET";
import { OccupationGroupCreateController } from "./POST";
import { OccupationGroupParentController } from "./[id]/parent/GET";
import { OccupationGroupChildrenController } from "./[id]/children/GET";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  const occupationGroupController = new OccupationGroupController();
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return occupationGroupController.postOccupationGroup(event);
  } else if (event?.httpMethod === HTTP_VERBS.GET) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.OCCUPATION_GROUP_ROUTE).regexp.exec(pathToMatch)) {
      return occupationGroupController.getOccupationGroup(event);
    } else if (pathToRegexp(Routes.OCCUPATION_GROUP_PARENT_ROUTE).regexp.exec(pathToMatch)) {
      return occupationGroupController.getParentOccupationGroup(event);
    } else if (pathToRegexp(Routes.OCCUPATION_GROUP_CHILDREN_ROUTE).regexp.exec(pathToMatch)) {
      return occupationGroupController.getOccupationGroupChildren(event);
    }
    return occupationGroupController.getOccupationGroups(event);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

export class OccupationGroupController {
  private readonly occupationGroupService: IOccupationGroupService;
  constructor() {
    this.occupationGroupService = getServiceRegistry().occupationGroup;
  }

  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups:
   *    post:
   *      operationId: POSTOccupationGroup
   *      tags:
   *        - occupationGroups
   *      summary: Create a new taxonomy occupation group.
   *      description: Create a new taxonomy occupation group in a specific taxonomy model.
   *      security:
   *       - api_key: []
   *       - jwt_auth: []
   *      parameters:
   *        - in: path
   *          name: modelId
   *          required: true
   *          schema:
   *            $ref: '#/components/schemas/OccupationGroupRequestParamSchemaGET/properties/modelId'
   *      requestBody:
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OccupationGroupRequestSchemaPOST'
   *         required: true
   *      responses:
   *         '201':
   *           description: Successfully created the occupation group,
   *           content:
   *             application/json:
   *               schema:
   *                  $ref: '#/components/schemas/OccupationGroupResponseSchemaPOST'
   *         '400':
   *           description: |
   *             Failed to create the occupation group. Additional information can be found in the response body.
   *           content:
   *             application/json:
   *                schema:
   *                  $ref: '#/components/schemas/POSTOccupationGroup400ErrorSchema'
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
  async postOccupationGroup(event: APIGatewayProxyEvent) {
    return new OccupationGroupCreateController().postOccupationGroup(event);
  }

  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups:
   *   get:
   *    operationId: GETOccupationGroups
   *    tags:
   *      - occupationGroups
   *    summary: Get a list of paginated occupation groups and cursor if there is one in a taxonomy model.
   *    description: Retrieve a list of paginated occupation groups in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestParamSchemaGET/properties/modelId'
   *      - in: query
   *        name: limit
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestQueryParamSchemaGET/properties/limit'
   *      - in: query
   *        name: cursor
   *        schema:
   *          $ref: '#/components/schemas/OccupationGroupRequestQueryParamSchemaGET/properties/cursor'
   *    responses:
   *      '200':
   *        description: Successfully retrieved the paginated occupation groups.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OccupationGroupResponseSchemaGET'
   *      '400':
   *        description: |
   *          Failed to retrieve the occupation groups. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupationGroup400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Occupation groups not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupationGroups404ErrorSchema'
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
  async getOccupationGroups(event: APIGatewayProxyEvent) {
    return new OccupationGroupListController().getOccupationGroups(event);
  }

  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups/{id}:
   *  get:
   *   operationId: GETOccupationGroupById
   *   tags:
   *    - occupationGroups
   *   summary: Get an occupation group by its identifier in a taxonomy model.
   *   description: Retrieve an occupation group by its unique identifier in a specific taxonomy model.
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
   *   responses:
   *     '200':
   *       description: Successfully retrieved the occupation group.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/OccupationGroupResponseSchemaPOST'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Occupation group not found.
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
  async getOccupationGroup(event: APIGatewayProxyEvent) {
    try {
      const requestPathParameter = parsePath<OccupationGroupAPISpecs.OccupationGroup.Types.Param.Payload>(
        Routes.OCCUPATION_GROUP_ROUTE,
        event.path
      );

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
      if (validationResult === ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.OccupationGroup.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationGroupAPISpecs.OccupationGroup.GET.Enums.Response.Status500.ErrorCodes
            .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_DETAIL,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const occupationGroup = await this.occupationGroupService.findById(requestPathParameter.id);
      if (!occupationGroup) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.OccupationGroup.GET.Enums.Response.Status404.ErrorCodes.OCCUPATION_GROUP_NOT_FOUND,
          "Occupation group not found",
          `No occupation group found with id: ${requestPathParameter.id}`
        );
      }
      return responseJSON(StatusCodes.OK, transform(occupationGroup, getResourcesBaseUrl()));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to get occupation group by id:", error);
      errorLoggerInstance.logError("Failed to retrieve the occupation group from the DB", error.name);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.OccupationGroup.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_DETAIL,
        "Failed to retrieve the occupation group from the DB",
        ""
      );
    }
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
   *   responses:
   *     '200':
   *       description: Successfully retrieved the occupation group parent.
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
    return new OccupationGroupParentController().getParentOccupationGroup(event);
  }
  /**
   * @openapi
   *
   * /models/{modelId}/occupationGroups/{id}/children:
   *  get:
   *   operationId: GETOccupationGroupChildrenByOccupationGroupId
   *   tags:
   *    - occupationGroups
   *   summary: Get occupation group children by its parent occupation group identifier in a taxonomy model.
   *   description: Retrieve occupation group children by its unique parent occupation group identifier in a specific taxonomy model.
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
   *   responses:
   *     '200':
   *       description: Successfully retrieved the occupation group children.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/OccupationGroupChildrenResponseSchemaGET'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Occupation group children or model not found.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETOccupationGroupChildren404ErrorSchema'
   *     '500':
   *       description: |
   *         The server encountered an unexpected condition.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getOccupationGroupChildren(event: APIGatewayProxyEvent) {
    return new OccupationGroupChildrenController().getOccupationGroupChildren(event);
  }
}
