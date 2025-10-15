import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, HTTP_VERBS, responseJSON, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
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

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  const occupationGroupController = new OccupationGroupController();
  //POST /occupationGroups
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return occupationGroupController.postOccupationGroup(event);
  } else if (event?.httpMethod == HTTP_VERBS.GET) {
    return occupationGroupController.getOccupationGroups(event);
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
   *                  $ref: '#/components/schemas/ErrorSchema'
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
    if (event.body?.length > OccupationGroupAPISpecs.Constants.MAX_PAYLOAD_LENGTH) {
      return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
        `Expected maximum length is ${OccupationGroupAPISpecs.Constants.MAX_PAYLOAD_LENGTH}`
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

    const newOccupationGroupSpec: INewOccupationGroupSpec = {
      originUri: payload.originUri,
      code: payload.code,
      description: payload.description,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      groupType: payload.groupType,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
      importId: null,
    };
    try {
      const newOccupationGroup = await getRepositoryRegistry().OccupationGroup.create(newOccupationGroupSpec);
      return responseJSON(StatusCodes.CREATED, transform(newOccupationGroup, getResourcesBaseUrl()));
    } catch (error: unknown) {
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
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
   *              $ref: '#/components/schemas/ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '500':
   *        $ref: '#/components/responses/InternalServerErrorResponse'
   *
   */
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
      const execMatch = Routes.OCCUPATION_GROUPS_ROUTE.exec(pathToMatch);
      const resolvedModelId = modelIdFromParams ?? (execMatch ? execMatch[1] : undefined);

      if (!resolvedModelId) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
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
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
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
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        "Failed to retrieve the occupation groups from the DB",
        ""
      );
    }
  }
}
