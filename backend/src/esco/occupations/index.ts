import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, HTTP_VERBS, responseJSON, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ajvInstance, ParseValidationError } from "validator";
import AuthAPISpecs from "api-specifications/auth";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import { ValidateFunction } from "ajv";
import { transform, transformPaginated } from "./transform";
import { getResourcesBaseUrl } from "server/config/config";
import { INewOccupationSpec } from "./occupation.types";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authenticator";
import ErrorAPISpecs from "api-specifications/error";
import { ObjectTypes } from "esco/common/objectTypes";
import errorLoggerInstance from "common/errorLogger/errorLogger";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  const occupationController = new OccupationController();
  //POST /occupations
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return occupationController.postOccupation(event);
  } else if (event?.httpMethod == HTTP_VERBS.GET) {
    const pathToMatch = event.path || "";
    const execMatch = Routes.OCCUPATION_BY_ID_ROUTE.exec(pathToMatch);
    if (execMatch) {
      return occupationController.getOccupationById(event);
    } else {
      return occupationController.getOccupations(event);
    }
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

class OccupationController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations:
   *    post:
   *      operationId: POSTOccupation
   *      tags:
   *        - occupations
   *      summary: Create a new taxonomy occupation.
   *      description: Create a new taxonomy occupation in a specific taxonomy model.
   *      security:
   *       - jwt_auth: []
   *      parameters:
   *        - in: path
   *          name: modelId
   *          required: true
   *          schema:
   *            $ref: '#/components/schemas/OccupationRequestParamSchemaGET/properties/modelId'
   *      requestBody:
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OccupationRequestSchemaPOST'
   *         required: true
   *      responses:
   *         '201':
   *           description: Successfully created the occupation,
   *           content:
   *             application/json:
   *               schema:
   *                  $ref: '#/components/schemas/OccupationResponseSchemaPOST'
   *         '400':
   *           description: |
   *             Failed to create the occupation. Additional information can be found in the response body.
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
  async postOccupation(event: APIGatewayProxyEvent) {
    if (!event.headers?.["Content-Type"]?.includes("application/json")) {
      // application/json;charset=utf-8
      return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
    }

    if (event.body && event.body.length > OccupationAPISpecs.Constants.MAX_PAYLOAD_LENGTH) {
      return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
        `Expected maximum length is ${OccupationAPISpecs.Constants.MAX_PAYLOAD_LENGTH}`
      );
    }

    let payload: OccupationAPISpecs.Types.POST.Request.Payload;
    try {
      payload = JSON.parse(event.body as string);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(errorMessage);
    }
    const validateFunction = ajvInstance.getSchema(
      OccupationAPISpecs.Schemas.POST.Request.Payload.$id as string
    ) as ValidateFunction;

    const isValid = validateFunction(payload);
    if (!isValid) {
      const errorDetail = ParseValidationError(validateFunction.errors);
      return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
    }

    // Extract modelId from path parameters and validate it matches the payload
    const modelIdFromParams = event.pathParameters?.modelId;
    const pathToMatch = event.path || "";
    const execMatch = Routes.OCCUPATIONS_ROUTE.exec(pathToMatch);
    const resolvedModelId = modelIdFromParams ?? execMatch?.[1];

    if (!resolvedModelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        OccupationAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
        "modelId is missing in the path",
        JSON.stringify({ path: event.path, pathParameters: event.pathParameters })
      );
    }

    if (payload.modelId !== resolvedModelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        OccupationAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${resolvedModelId}`
      );
    }

    // Validate model exists and is not released
    const model = await getRepositoryRegistry().modelInfo.getModelById(payload.modelId);
    if (!model) {
      return errorResponse(
        StatusCodes.NOT_FOUND,
        OccupationAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
        "Failed to create the occupation because the specified modelId does not exist",
        "Model could not be found"
      );
    }
    if (model.released) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        OccupationAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
        "Failed to create the occupation because the specified modelId refers to a released model",
        "Cannot add occupations to a released model"
      );
    }

    const newOccupationSpec: INewOccupationSpec = {
      originUri: payload.originUri,
      code: payload.code,
      description: payload.description,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      occupationType: payload.occupationType as unknown as ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
      importId: null,
      occupationGroupCode: payload.occupationGroupCode,
      definition: payload.definition,
      scopeNote: payload.scopeNote,
      regulatedProfessionNote: payload.regulatedProfessionNote,
      isLocalized: payload.isLocalized,
    };
    try {
      const newOccupation = await getRepositoryRegistry().occupation.create(newOccupationSpec);
      return responseJSON(StatusCodes.CREATED, transform(newOccupation, getResourcesBaseUrl()));
    } catch (error: unknown) {
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      errorLoggerInstance.logError(
        "Failed to create the occupation in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
        "Failed to create the occupation in the DB",
        ""
      );
    }
  }

  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}:
   *   get:
   *    operationId: GETOccupationById
   *    tags:
   *      - occupations
   *    summary: Get a single occupation by its ID in a taxonomy model.
   *    description: Retrieve a single occupation by its ID in a specific taxonomy model.
   *    security:
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestParamSchemaGET/properties/modelId'
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: string
   *          description: The unique ID of the occupation.
   *    responses:
   *      '200':
   *        description: Successfully retrieved the occupation.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OccupationResponseSchemaPOST'
   *      '400':
   *        description: |
   *          Failed to retrieve the occupation. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Occupation not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ErrorSchema'
   *      '500':
   *        $ref: '#/components/responses/InternalServerErrorResponse'
   *
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getOccupationById(event: APIGatewayProxyEvent) {
    try {
      // extract the modelId and id from the pathParameters
      const modelIdFromParams = event.pathParameters?.modelId;
      const idFromParams = event.pathParameters?.id;
      const pathToMatch = event.path || "";
      const execMatch = Routes.OCCUPATION_BY_ID_ROUTE.exec(pathToMatch);
      const resolvedModelId = modelIdFromParams ?? execMatch?.[1];
      const resolvedId = idFromParams ?? execMatch?.[2];

      if (!resolvedModelId) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "modelId is missing in the path",
          JSON.stringify({ path: event.path, pathParameters: event.pathParameters })
        );
      }

      if (!resolvedId) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "id is missing in the path",
          JSON.stringify({ path: event.path, pathParameters: event.pathParameters })
        );
      }

      const requestPathParameter: OccupationAPISpecs.Types.GET.Request.Param.Payload = {
        modelId: resolvedModelId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        OccupationAPISpecs.Schemas.GET.Request.Param.Payload.$id as string
      ) as ValidateFunction<OccupationAPISpecs.Types.GET.Request.Param.Payload>;
      const isValid = validatePathFunction(requestPathParameter);
      if (!isValid) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid modelId", path: event.path, pathParameters: event.pathParameters })
        );
      }

      // Validate that the model exists
      const model = await getRepositoryRegistry().modelInfo.getModelById(requestPathParameter.modelId);
      if (!model) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }

      // call the repository to get the occupation by id
      const occupation = await getRepositoryRegistry().occupation.findById(resolvedId);

      if (!occupation) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "Occupation not found",
          JSON.stringify({ id: resolvedId })
        );
      }

      return responseJSON(StatusCodes.OK, transform(occupation, getResourcesBaseUrl()));
    } catch (e: unknown) {
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      errorLoggerInstance.logError(
        "Failed to retrieve the occupation from the DB",
        e instanceof Error ? e.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
        "Failed to retrieve the occupation from the DB",
        ""
      );
    }
  }

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
   *        name: next_cursor
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestQueryParamSchemaGET/properties/next_cursor'
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
   *              $ref: '#/components/schemas/ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '500':
   *        $ref: '#/components/responses/InternalServerErrorResponse'
   *
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getOccupations(event: APIGatewayProxyEvent) {
    // pagination decoding and pointing and also generating the base64 cursor for the next pagination and return it
    try {
      // extract the modelId from the pathParameters
      // NOTE: Since we're using a single '{proxy+}' resource in API Gateway path params
      // like `{modelId}` are not populated under `pathParameters` instead, the full path is put in
      // `pathParameters.proxy` and `event.path`. To support both setups (explicit param resource and proxy),
      // we fallback to parse the `event.path` if `pathParameters.modelId` is absent.
      const modelIdFromParams = event.pathParameters?.modelId;
      const pathToMatch = event.path || "";
      const execMatch = Routes.OCCUPATIONS_ROUTE.exec(pathToMatch);
      const resolvedModelId = execMatch?.[1] ?? modelIdFromParams;

      if (!resolvedModelId) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "modelId is missing in the path",
          JSON.stringify({ path: event.path, pathParameters: event.pathParameters })
        );
      }
      const requestPathParameter: OccupationAPISpecs.Types.GET.Request.Param.Payload = {
        modelId: resolvedModelId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        OccupationAPISpecs.Schemas.GET.Request.Param.Payload.$id as string
      ) as ValidateFunction<OccupationAPISpecs.Types.GET.Request.Param.Payload>;
      const isValid = validatePathFunction(requestPathParameter);
      if (!isValid) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid modelId", path: event.path, pathParameters: event.pathParameters })
        );
      }
      const rawQueryParams = (event.queryStringParameters || {}) as { limit?: string; next_cursor?: string };
      const queryParams: OccupationAPISpecs.Types.GET.Request.Query.Payload = {};
      if (rawQueryParams.limit) {
        queryParams.limit = Number.parseInt(rawQueryParams.limit, 10);
      }
      if (rawQueryParams.next_cursor) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (queryParams as any).next_cursor = rawQueryParams.next_cursor;
      }

      const validateQueryFunction = ajvInstance.getSchema(
        OccupationAPISpecs.Schemas.GET.Request.Query.Payload.$id as string
      ) as ValidateFunction<OccupationAPISpecs.Types.GET.Request.Query.Payload>;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((queryParams as any).next_cursor) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cursor = getRepositoryRegistry().occupation.decodeCursor((queryParams as any).next_cursor);
      }

      // here call the repository to get the occupation by limit starting from the cursor id field
      const currentPageOccupations = await getRepositoryRegistry().occupation.findPaginated(
        requestPathParameter.modelId,
        cursor?.id,
        limit
      );

      let nextCursor: string | null = null;
      if (currentPageOccupations?.nextCursor?._id) {
        nextCursor = getRepositoryRegistry().occupation.encodeCursor(
          currentPageOccupations.nextCursor._id,
          currentPageOccupations.nextCursor.createdAt
        );
      }

      return responseJSON(
        StatusCodes.OK,
        transformPaginated(currentPageOccupations.items, getResourcesBaseUrl(), limit, nextCursor)
      );
    } catch (e: unknown) {
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      errorLoggerInstance.logError(
        "Failed to retrieve the occupations from the DB",
        e instanceof Error ? e.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
        "Failed to retrieve the occupations from the DB",
        ""
      );
    }
  }
}
