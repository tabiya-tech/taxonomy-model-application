import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import {
  errorResponse,
  errorResponseGET,
  errorResponsePOST,
  HTTP_VERBS,
  responseJSON,
  StatusCodes,
  STD_ERRORS_RESPONSES,
} from "server/httpUtils";
import { ajvInstance, ParseValidationError } from "validator";
import AuthAPISpecs from "api-specifications/auth";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { ValidateFunction } from "ajv";
import { transform, transformPaginated, transformPaginatedChildren, transformParent } from "./transform";
import { getResourcesBaseUrl } from "server/config/config";
import {
  BasePathParams,
  INewOccupationGroupSpecWithoutImportId,
  ModelForOccupationGroupValidationErrorCode,
} from "./OccupationGroup.types";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import ErrorAPISpecs from "api-specifications/error";
import { pathToRegexp } from "path-to-regexp";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { IOccupationGroupService, OccupationGroupModelValidationError } from "./occupationGroupService.type";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { parsePath } from "common/parsePath/parsePath";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  const occupationGroupController = new OccupationGroupController();
  // POST /occupation-groups
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
   * Encode an object {_id: string, createdAt: Date} into a base64 string
   * @param {string} id - The Document id to encode
   * @param {Date} createdAt - The Document creation date to encode
   * @return {string} - The base64 encoded cursor
   */
  private encodeCursor(id: string, createdAt: Date): string {
    const payload = {
      id: id,
      createdAt: createdAt.toISOString(),
    };
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString("base64");
  }

  /**
   * Decode a base64 string into an object {_id: string, createdAt: Date}
   * @param {string} cursor - The base64 encoded cursor
   * @return {{id: string, createdAt: Date}} - The decoded object
   */
  private decodeCursor(cursor: string): { id: string; createdAt: Date } {
    const json = Buffer.from(cursor, "base64").toString("utf-8");
    const payload = JSON.parse(json);
    return {
      id: payload.id,
      createdAt: new Date(payload.createdAt),
    };
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
    if (!event.headers["Content-Type"]?.includes("application/json")) {
      // application/json;charset=utf-8
      return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
    }

    //@ts-ignore
    if (event.body?.length > OccupationGroupAPISpecs.Constants.MAX_POST_PAYLOAD_LENGTH) {
      return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
        `Expected maximum length is ${OccupationGroupAPISpecs.Constants.MAX_POST_PAYLOAD_LENGTH}`
      );
    }

    let payload: OccupationGroupAPISpecs.Types.POST.Request.Payload;

    try {
      payload = JSON.parse(event.body as string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(error.message);
    }
    const validateFunction = ajvInstance.getSchema(
      OccupationGroupAPISpecs.Schemas.POST.Request.Payload.$id as string
    ) as ValidateFunction;

    const isValid = validateFunction(payload);
    if (!isValid) {
      const errorDetail = ParseValidationError(validateFunction.errors);
      return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
    }
    const { modelId: resolvedModelId } = parsePath<BasePathParams>(Routes.OCCUPATION_GROUPS_ROUTE, event.path);
    if (!resolvedModelId) {
      return errorResponsePOST(
        StatusCodes.BAD_REQUEST,
        OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        "modelId is missing in the path",
        JSON.stringify({ path: event.path, pathParameters: event.pathParameters })
      );
    }

    // Validate that the modelId in the payload matches the modelId in the path
    if (payload.modelId !== resolvedModelId) {
      return errorResponsePOST(
        StatusCodes.BAD_REQUEST,
        OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${resolvedModelId}`
      );
    }

    const newOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId = {
      originUri: payload.originUri,
      code: payload.code,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      description: payload.description,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
      groupType: payload.groupType,
    };
    try {
      const newOccupationGroup = await this.occupationGroupService.create(newOccupationGroupSpec);
      return responseJSON(StatusCodes.CREATED, transform(newOccupationGroup, getResourcesBaseUrl()));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // log an error in the server for debugging purpose
      errorLoggerInstance.logError("Failed to create occupation group in the DB", error.name);
      if (error instanceof OccupationGroupModelValidationError) {
        switch (error.code) {
          case ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponsePOST(
              StatusCodes.NOT_FOUND,
              OccupationGroupAPISpecs.Enums.POST.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponsePOST(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
              "Failed to fetch the model detail from the DB",
              ""
            );
          case ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponsePOST(
              StatusCodes.BAD_REQUEST,
              OccupationGroupAPISpecs.Enums.POST.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Model is released and cannot be modified",
              ""
            );
          default:
            return errorResponsePOST(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
              "Failed to create the occupation group in the DB",
              ""
            );
        }
      } else {
        return errorResponsePOST(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
          "Failed to create the occupation group in the DB",
          ""
        );
      }
    }
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
    try {
      const { modelId: resolvedModelId } = parsePath<BasePathParams>(Routes.OCCUPATION_GROUPS_ROUTE, event.path);
      if (!resolvedModelId) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "modelId is missing in the path",
          JSON.stringify({ path: event.path, pathParameters: event.pathParameters, query: event.queryStringParameters })
        );
      }
      const requestPathParameter: OccupationGroupAPISpecs.Types.GET.Request.Param.Payload = {
        modelId: resolvedModelId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.Types.GET.Request.Param.Payload>;

      const isValid = validatePathFunction(requestPathParameter);
      if (!isValid) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid modelId", path: event.path, pathParameters: event.pathParameters })
        );
      }

      const validationResult = await this.occupationGroupService.validateModelForOccupationGroup(
        requestPathParameter.modelId
      );
      if (validationResult === ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const rawQueryParams = (event.queryStringParameters || {}) as { limit?: string; cursor?: string };
      const queryParams: OccupationGroupAPISpecs.Types.GET.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor,
      };

      const validateQueryFunction = ajvInstance.getSchema(
        OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.Types.GET.Request.Query.Payload>;
      const isQueryValid = validateQueryFunction(queryParams);
      if (!isQueryValid) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid query parameters", path: event.path, query: event.queryStringParameters })
        );
      }

      // extract the nextCursor and the limit from the query parameter
      let limit = 100;
      if (queryParams.limit) {
        limit = queryParams.limit;
      }
      // here decode the cursor base64 if provided
      let decodedCursor: { id: string; createdAt: Date } | undefined = undefined;
      if (queryParams.cursor) {
        try {
          decodedCursor = this.decodeCursor(queryParams.cursor);
        } catch (e: unknown) {
          console.error("Failed to decode cursor:", e);
          return errorResponseGET(
            StatusCodes.BAD_REQUEST,
            ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
            "Invalid cursor parameter",
            ""
          );
        }
      }
      // here call the service to get the occupation group by limit starting from the cursor
      const currentPageOccupationGroups = await this.occupationGroupService.findPaginated(
        requestPathParameter.modelId,
        decodedCursor,
        limit
      );

      let nextCursor: string | null = null;
      if (currentPageOccupationGroups?.nextCursor?._id) {
        nextCursor = this.encodeCursor(
          currentPageOccupationGroups.nextCursor._id,
          currentPageOccupationGroups.nextCursor.createdAt
        );
      }
      return responseJSON(
        StatusCodes.OK,
        transformPaginated(currentPageOccupationGroups.items, getResourcesBaseUrl(), limit, nextCursor)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to retrieve occupation groups:", error);
      errorLoggerInstance.logError("Failed to retrieve the occupation groups from the DB", error.name);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        "Failed to retrieve the occupation groups from the DB",
        ""
      );
    }
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
      const requestPathParameter = parsePath<OccupationGroupAPISpecs.Types.GET.Request.Detail.Param.Payload>(
        Routes.OCCUPATION_GROUP_ROUTE,
        event.path
      );

      const validatePathFunction = ajvInstance.getSchema(
        OccupationGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.Types.GET.Request.Detail.Param.Payload>;

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
          OccupationGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const occupationGroup = await this.occupationGroupService.findById(requestPathParameter.id);
      if (!occupationGroup) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_GROUP_NOT_FOUND,
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
        OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
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
    try {
      const requestPathParameter = parsePath<OccupationGroupAPISpecs.Types.GET.Request.Detail.Param.Payload>(
        Routes.OCCUPATION_GROUP_PARENT_ROUTE,
        event.path
      );

      const validatePathFunction = ajvInstance.getSchema(
        OccupationGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.Types.GET.Request.Detail.Param.Payload>;

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
          OccupationGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      const parentOccupationGroup = await this.occupationGroupService.findParent(requestPathParameter.id);
      if (!parentOccupationGroup) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_GROUP_PARENT_NOT_FOUND,
          "Occupation group or parent not found",
          `No occupation group or parent found with occupation group id: ${requestPathParameter.id}`
        );
      }
      return responseJSON(StatusCodes.OK, transformParent(parentOccupationGroup, getResourcesBaseUrl()));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to get parent occupation group:", error);
      errorLoggerInstance.logError("Failed to retrieve the parent occupation group from the DB", error.name);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        "Failed to retrieve the parent occupation group from the DB",
        ""
      );
    }
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
    try {
      const requestPathParameter = parsePath<OccupationGroupAPISpecs.Types.GET.Request.Detail.Param.Payload>(
        Routes.OCCUPATION_GROUP_CHILDREN_ROUTE,
        event.path
      );

      const validatePathFunction = ajvInstance.getSchema(
        OccupationGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.Types.GET.Request.Detail.Param.Payload>;

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

      // TODO: Prefer using `modelInfoService.ts`
      const validationResult = await this.occupationGroupService.validateModelForOccupationGroup(
        requestPathParameter.modelId
      );
      if (validationResult === ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const children = await this.occupationGroupService.findChildren(requestPathParameter.id);

      return responseJSON(StatusCodes.OK, transformPaginatedChildren(children, getResourcesBaseUrl(), null, null));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to get occupation group children:", error);
      errorLoggerInstance.logError("Failed to retrieve the occupation group children from the DB", error.name);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        "Failed to retrieve the occupation group children from the DB",
        ""
      );
    }
  }
}
