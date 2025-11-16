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
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ajvInstance, ParseValidationError } from "validator";
import AuthAPISpecs from "api-specifications/auth";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { ValidateFunction } from "ajv";
import { transform, transformPaginated } from "./transform";
import { getResourcesBaseUrl } from "server/config/config";
import { INewOccupationGroupSpec } from "./OccupationGroup.types";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authenticator";
import ErrorAPISpecs from "api-specifications/error";
import { pathToRegexp } from "path-to-regexp";
import errorLoggerInstance from "common/errorLogger/errorLogger";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  const { path, httpMethod } = event;
  const occupationGroupController = new OccupationGroupController();

  if (httpMethod === HTTP_VERBS.POST) {
    return occupationGroupController.postOccupationGroup(event);
  }

  if (httpMethod === HTTP_VERBS.GET) {
    // Check if it's an individual occupation group request (has ID) or list request
    const individualMatch = pathToRegexp(Routes.OCCUPATION_GROUP_ROUTE).regexp.exec(path);
    return individualMatch
      ? occupationGroupController.getOccupationGroup(event)
      : occupationGroupController.getOccupationGroups(event);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

class OccupationGroupController {
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
   *                  $ref: '#/components/schemas/ErrorSchemaPOST'
   *         '403':
   *           $ref: '#/components/responses/ForbiddenResponse'
   *         '401':
   *           $ref: '#/components/responses/UnAuthorizedResponse'
   *         '415':
   *           $ref: '#/components/responses/AcceptOnlyJSONResponse'
   *         '500':
   *           $ref: '#/components/responses/InternalServerErrorResponse'
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(errorMessage);
    }
    const validateFunction = ajvInstance.getSchema(
      OccupationGroupAPISpecs.Schemas.POST.Request.Payload.$id as string
    ) as ValidateFunction;

    const isValid = validateFunction(payload);
    if (!isValid) {
      const errorDetail = ParseValidationError(validateFunction.errors);
      return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
    }

    // Extract modelId from path parameters and validate it matches the payload
    const modelIdFromParams = event.pathParameters?.modelId;
    const pathToMatch = event.path || "";
    const execMatch = pathToRegexp(Routes.OCCUPATION_GROUPS_ROUTE).regexp.exec(pathToMatch);
    const resolvedModelId = modelIdFromParams ?? (execMatch ? execMatch[1] : undefined);

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

    // here first check the model is released or not if it is released do not allow adding occupationGroups for it
    const model = await getRepositoryRegistry().modelInfo.getModelById(payload.modelId);
    if (!model) {
      return errorResponsePOST(
        StatusCodes.NOT_FOUND,
        OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        "Failed to create the occupation group because the specified modelId does not exist",
        "Model could not be found"
      );
    }
    if (model.released) {
      return errorResponsePOST(
        StatusCodes.BAD_REQUEST,
        OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        "Failed to create the occupation group because the specified modelId refers to a released model",
        "Cannot add occupation groups to a released model"
      );
    }

    const newOccupationGroupSpec: INewOccupationGroupSpec = {
      originUri: payload.originUri,
      code: payload.code,
      description: payload.description,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      groupType: payload.groupType,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
      importId: "",
    };
    try {
      const newOccupationGroup = await getRepositoryRegistry().OccupationGroup.create(newOccupationGroupSpec);
      return responseJSON(StatusCodes.CREATED, transform(newOccupationGroup, getResourcesBaseUrl()));
    } catch (error: unknown) {
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      errorLoggerInstance.logError(
        "Failed to create the occupation group in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponsePOST(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        "Failed to create the occupation group in the DB",
        ""
      );
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
   *              $ref: '#/components/schemas/ErrorSchemaGET'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '500':
   *        $ref: '#/components/responses/InternalServerErrorResponse'
   *
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getOccupationGroups(event: APIGatewayProxyEvent) {
    // here is where the pagination decoding and pointing and also generating the base64 cursor for the next pagination and return it
    try {
      // extract the modelId from the pathParameters
      // NOTE: Since we're using a single '{proxy+}' resource in API Gateway path params
      // like `{modelId}` are not populated under `pathParameters` instead, the full path is put in
      // `pathParameters.proxy` and `event.path`. To support both setups (explicit param resource and proxy),
      // we fallback to parse the `event.path` if `pathParameters.modelId` is absent.
      const modelIdFromParams = event.pathParameters?.modelId;
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.OCCUPATION_GROUPS_ROUTE).regexp.exec(pathToMatch);
      const resolvedModelId = modelIdFromParams ?? (execMatch ? execMatch[1] : undefined);

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
      let cursor: { id: string; createdAt: Date } | null = null;
      if (queryParams.cursor) {
        cursor = getRepositoryRegistry().OccupationGroup.decodeCursor(queryParams.cursor);
      }

      // here call the repository to get the occupationGroup by limit starting from the cursor id field
      const currentPageOccupationGroups = await getRepositoryRegistry().OccupationGroup.findPaginated(
        requestPathParameter.modelId,
        cursor?.id,
        limit
      );

      let nextCursor: string | null = null;
      if (currentPageOccupationGroups?.nextCursor?._id) {
        nextCursor = getRepositoryRegistry().OccupationGroup.encodeCursor(
          currentPageOccupationGroups.nextCursor._id,
          currentPageOccupationGroups.nextCursor.createdAt
        );
      }

      return responseJSON(
        StatusCodes.OK,
        transformPaginated(currentPageOccupationGroups.items, getResourcesBaseUrl(), limit, nextCursor)
      );
    } catch (e: unknown) {
      errorLoggerInstance.logError(
        "Failed to retrieve the occupation groups from the DB",
        e instanceof Error ? e.name : "Unknown error"
      );
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
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
   *     '400':
   *       description: |
   *         Failed to retrieve the occupation group. Additional information can be found in the response body.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ErrorSchemaGET'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Occupation group not found.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ErrorSchemaGET'
   *     '500':
   *       $ref: '#/components/responses/InternalServerErrorResponse'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getOccupationGroup(event: APIGatewayProxyEvent) {
    try {
      const idFromParams = event.pathParameters?.id;
      const modelIdFromParams = event.pathParameters?.modelId;
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.OCCUPATION_GROUP_ROUTE).regexp.exec(pathToMatch);
      const resolvedOccupationGroupId = idFromParams ?? (execMatch ? execMatch[2] : "");
      const resolvedModelId = modelIdFromParams ?? (execMatch ? execMatch[1] : "");

      const requestPathParameter: OccupationGroupAPISpecs.Types.GET.Request.Detail.Param.Payload = {
        modelId: resolvedModelId,
        id: resolvedOccupationGroupId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        OccupationGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.Types.GET.Request.Detail.Param.Payload>;

      const isValid = validatePathFunction(requestPathParameter);
      if (!isValid) {
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

      // Validate that the model exists
      const model = await getRepositoryRegistry().modelInfo.getModelById(requestPathParameter.modelId);
      if (!model) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }

      const occupationGroup = await getRepositoryRegistry().OccupationGroup.findById(requestPathParameter.id);
      if (!occupationGroup?.id) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "Occupation group not found",
          `No occupation group found with id: ${requestPathParameter.id}`
        );
      }
      return responseJSON(StatusCodes.OK, transform(occupationGroup, getResourcesBaseUrl()));
    } catch (e: unknown) {
      errorLoggerInstance.logError(
        "Failed to retrieve the occupation group from the DB",
        e instanceof Error ? e.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        "Failed to retrieve the occupation group from the DB",
        ""
      );
    }
  }
}
