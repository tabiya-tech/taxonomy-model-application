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
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ajvInstance, ParseValidationError } from "validator";
import AuthAPISpecs from "api-specifications/auth";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import { ValidateFunction } from "ajv";
import {
  transform,
  transformDynamicEntity,
  transformPaginated,
  transformPaginatedRelation,
  transformPaginatedSkills,
} from "./transform";
import { getResourcesBaseUrl } from "server/config/config";
import { INewOccupationSpecWithoutImportId } from "./occupation.types";
import { Routes } from "routes.constant";
import { pathToRegexp } from "path-to-regexp";
import { RoleRequired } from "auth/authorizer";
import ErrorAPISpecs from "api-specifications/error";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  IOccupationService,
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "./occupationService.types";
import { parsePath } from "common/parsePath/parsePath";
import errorLoggerInstance from "common/errorLogger/errorLogger";

type BasePathParams = {
  modelId?: string;
};

export const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent
) => {
  const occupationController = new OccupationController();
  //POST /occupations
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return occupationController.postOccupation(event);
  } else if (event?.httpMethod == HTTP_VERBS.GET) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.OCCUPATION_ROUTE).regexp.exec(pathToMatch)) {
      return occupationController.getOccupationById(event);
    } else if (pathToRegexp(Routes.OCCUPATION_PARENT_ROUTE).regexp.exec(pathToMatch)) {
      return occupationController.getParent(event);
    } else if (pathToRegexp(Routes.OCCUPATION_CHILDREN_ROUTE).regexp.exec(pathToMatch)) {
      return occupationController.getChildren(event);
    } else if (pathToRegexp(Routes.OCCUPATION_SKILLS_ROUTE).regexp.exec(pathToMatch)) {
      return occupationController.getSkills(event);
    } else {
      return occupationController.getOccupations(event);
    }
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

export class OccupationController {
  private readonly occupationService: IOccupationService;

  constructor() {
    this.occupationService = getServiceRegistry().occupation;
  }

  private parseJSON(body: string) {
    return JSON.parse(body);
  }

  /**
   * Encode an object {_id: string, createdAt: Date} into a base64 string
   * @param {string} id - The Document id to encode
   * @param {Date} createdAt - The Document createdAt date to encode
   * @return {string} - The base64 encoded string
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
   * @param {string} cursor - The base64 encoded cursor string
   * @return {{id: string, createdAt: Date}} - The decoded cursor object
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
   * /models/{modelId}/occupations:
   *    post:
   *      operationId: POSTOccupation
   *      tags:
   *        - occupations
   *      summary: Create a new taxonomy occupation.
   *      description: Create a new taxonomy occupation in a specific taxonomy model.
   *      security:
   *       - api_key: []
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
   *                  $ref: '#/components/schemas/POSTOccupation400ErrorSchema'
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
  async postOccupation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    if (!event.headers?.["Content-Type"]?.includes("application/json")) {
      // application/json;charset=utf-8
      return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
    }

    if (event.body == null) {
      return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR("Body is empty");
    }

    if (event.body.length > OccupationAPISpecs.Constants.MAX_POST_PAYLOAD_LENGTH) {
      return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
        `Expected maximum length is ${OccupationAPISpecs.Constants.MAX_POST_PAYLOAD_LENGTH}`
      );
    }

    let payload: OccupationAPISpecs.Types.POST.Request.Payload;
    try {
      payload = this.parseJSON(event.body);
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
    const { modelId: resolvedModelId } = parsePath<BasePathParams>(Routes.OCCUPATIONS_ROUTE, event.path);

    if (!resolvedModelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        OccupationAPISpecs.Enums.POST.Response.Status400.ErrorCodes.INVALID_MODEL_ID,
        "modelId is missing in the path",
        JSON.stringify({ path: event.path, pathParameters: event.pathParameters })
      );
    }

    if (payload.modelId !== resolvedModelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        OccupationAPISpecs.Enums.POST.Response.Status400.ErrorCodes.INVALID_MODEL_ID,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${resolvedModelId}`
      );
    }

    const newOccupationSpec: INewOccupationSpecWithoutImportId = {
      originUri: payload.originUri,
      code: payload.code,
      description: payload.description,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      occupationType:
        payload.occupationType === OccupationAPISpecs.Enums.OccupationType.ESCOOccupation
          ? ObjectTypes.ESCOOccupation
          : ObjectTypes.LocalOccupation,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
      occupationGroupCode: payload.occupationGroupCode,
      definition: payload.definition,
      scopeNote: payload.scopeNote,
      regulatedProfessionNote: payload.regulatedProfessionNote,
      isLocalized: payload.isLocalized,
    };
    try {
      const newOccupation = await this.occupationService.create(newOccupationSpec);
      return responseJSON(StatusCodes.CREATED, transform(newOccupation, getResourcesBaseUrl()));
    } catch (error: unknown) {
      // log an error in the server logs for debugging purposes
      console.error("Failed to create occupation:", error);

      if (error instanceof OccupationModelValidationError) {
        switch (error.code) {
          case ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationAPISpecs.Enums.POST.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
              "Failed to fetch the model details from the DB",
              ""
            );
          case ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.Enums.POST.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot add occupations to a released model",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
              "Failed to create the occupation in the DB",
              ""
            );
        }
      } else {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Enums.POST.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION,
          "Failed to create the occupation in the DB",
          ""
        );
      }
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
   *      - api_key: []
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
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Occupation not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation404ErrorSchema'
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
  async getOccupationById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.OCCUPATION_ROUTE).regexp.exec(pathToMatch);
      if (!execMatch) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          "Route did not match",
          ""
        );
      }
      const resolvedId = execMatch[2];
      const resolvedModelId = execMatch[1];

      const requestPathParameter: OccupationAPISpecs.Types.GET.Request.Detail.Param.Payload = {
        modelId: resolvedModelId,
        id: resolvedId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id as string
      ) as ValidateFunction<OccupationAPISpecs.Types.GET.Request.Detail.Param.Payload>;

      const isValidPathParameter = validatePathFunction(requestPathParameter);
      if (!isValidPathParameter) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({
            reason: "Invalid modelId or occupation Id",
            path: event.path,
            pathParameters: event.pathParameters,
          })
        );
      }

      // Validate that the model exists (allow reading from released models)
      const validationResult = await this.occupationService.validateModelForOccupation(requestPathParameter.modelId);
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      const occupation = await this.occupationService.findById(requestPathParameter.id);
      if (!occupation) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "occupation not found",
          `No occupation found with id: ${requestPathParameter.id}`
        );
      }
      return responseJSON(StatusCodes.OK, transform(occupation, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to get occupation by id:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the occupation from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
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
   *      - api_key: []
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
   *        name: cursor
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestQueryParamSchemaGET/properties/cursor'
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
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Occupations not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupations404ErrorSchema'
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
  async getOccupations(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    // pagination decoding and pointing and also generating the base64 cursor for the next pagination and return it
    try {
      const { modelId: resolvedModelId } = parsePath<BasePathParams>(Routes.OCCUPATIONS_ROUTE, event.path);

      if (!resolvedModelId) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          "Route did not match",
          ""
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

      const validationResult = await this.occupationService.validateModelForOccupation(requestPathParameter.modelId);
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const rawQueryParams = event.queryStringParameters || {};
      const queryParams: OccupationAPISpecs.Types.GET.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor ?? undefined,
      };

      const validateQueryFunction = ajvInstance.getSchema(
        OccupationAPISpecs.Schemas.GET.Request.Query.Payload.$id as string
      ) as ValidateFunction<OccupationAPISpecs.Types.GET.Request.Query.Payload>;
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
      let limit = OccupationAPISpecs.Constants.DEFAULT_LIMIT;
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

      // here call the service to get the occupation by limit starting from the cursor
      const currentPageOccupations = await this.occupationService.findPaginated(
        requestPathParameter.modelId,
        decodedCursor,
        limit
      );

      let nextCursor: string | null = null;
      if (currentPageOccupations?.nextCursor?._id) {
        nextCursor = this.encodeCursor(
          currentPageOccupations.nextCursor._id,
          currentPageOccupations.nextCursor.createdAt
        );
      }

      return responseJSON(
        StatusCodes.OK,
        transformPaginated(currentPageOccupations.items, getResourcesBaseUrl(), limit, nextCursor)
      );
    } catch (error: unknown) {
      console.error("Failed to retrieve occupations:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the occupations from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
        "Failed to retrieve the occupations from the DB",
        ""
      );
    }
  }

  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}/parent:
   *   get:
   *    operationId: GETOccupationParents
   *    tags:
   *      - occupations
   *    summary: Get the parent occupation of a specific occupation.
   *    description: Retrieve the parent occupation of a specific occupation in a taxonomy model.
   *    security:
   *      - api_key: []
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
   *        description: Successfully retrieved the parent occupation.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OccupationResponseSchemaGETParent'
   *      '400':
   *        description: |
   *          Failed to retrieve the parent occupation. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Occupation not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupationParent404ErrorSchema'
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
  async getParent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.OCCUPATION_PARENT_ROUTE).regexp.exec(pathToMatch);
      if (!execMatch) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          "Route did not match",
          ""
        );
      }
      const modelId = execMatch[1];
      const id = execMatch[2];

      const requestPathParameter = { modelId, id };
      const validatePathFunction = ajvInstance.getSchema(
        OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id as string
      ) as ValidateFunction<OccupationAPISpecs.Types.GET.Request.Detail.Param.Payload>;

      const isValidPathParameter = validatePathFunction(requestPathParameter);
      if (!isValidPathParameter) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({
            reason: "Invalid modelId or occupation Id",
            path: event.path,
            pathParameters: event.pathParameters,
          })
        );
      }

      const validationResult = await this.occupationService.validateModelForOccupation(modelId);
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${modelId}`
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const occupation = await this.occupationService.findById(id);
      if (!occupation) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "occupation not found",
          `No occupation found with id: ${id}`
        );
      }

      const parent = await this.occupationService.getParent(modelId, id);
      if (!parent) return responseJSON(StatusCodes.OK, null);

      // Use unified transformer for full entity response
      return responseJSON(StatusCodes.OK, transformDynamicEntity(parent, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to get parent:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the occupation parent from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Enums.GET.Response.Status500.Parent.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_PARENT,
        "Failed to retrieve the occupation parent from the DB",
        ""
      );
    }
  }

  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}/children:
   *  get:
   *   operationId: GETOccupationChildren
   *   tags:
   *    - occupations
   *   summary: Get the children of an occupation.
   *   description: Retrieve the direct children of a specific occupation in a taxonomy model.
   *   security:
   *    - api_key: []
   *    - jwt_auth: []
   *   parameters:
   *    - in: path
   *      name: modelId
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/OccupationRequestByIdParamSchemaGET/properties/modelId'
   *    - in: path
   *      name: id
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/OccupationRequestByIdParamSchemaGET/properties/id'
   *    - in: query
   *      name: limit
   *      required: false
   *      schema:
   *        $ref: '#/components/schemas/OccupationChildrenRequestQueryParamSchemaGET/properties/limit'
   *    - in: query
   *      name: cursor
   *      schema:
   *        $ref: '#/components/schemas/OccupationChildrenRequestQueryParamSchemaGET/properties/cursor'
   *   responses:
   *     '200':
   *       description: Successfully retrieved the children.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/OccupationResponseSchemaGETChildren'
   *     '400':
   *       description: |
   *         Failed to retrieve the children. Additional information can be found in the response body.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Occupation or model not found.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETOccupationChildren404ErrorSchema'
   *     '500':
   *       description: |
   *         The server encountered an unexpected condition.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getChildren(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.OCCUPATION_CHILDREN_ROUTE).regexp.exec(pathToMatch);
      if (!execMatch) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          "Route did not match",
          ""
        );
      }
      const modelId = execMatch[1];
      const id = execMatch[2];

      const requestPathParameter = { modelId, id };
      const validatePathFunction = ajvInstance.getSchema(
        OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id as string
      ) as ValidateFunction<OccupationAPISpecs.Types.GET.Request.Detail.Param.Payload>;

      const isValidPathParameter = validatePathFunction(requestPathParameter);
      if (!isValidPathParameter) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({
            reason: "Invalid modelId or occupation Id",
            path: event.path,
            pathParameters: event.pathParameters,
          })
        );
      }

      const validationResult = await this.occupationService.validateModelForOccupation(modelId);
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${modelId}`
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const rawQueryParams = event.queryStringParameters || {};
      const queryParams: OccupationAPISpecs.Types.GET.Children.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor ?? undefined,
      };

      const validateQueryFunction = ajvInstance.getSchema(
        OccupationAPISpecs.Schemas.GET.Children.Request.Query.Payload.$id as string
      ) as ValidateFunction<OccupationAPISpecs.Types.GET.Children.Request.Query.Payload>;

      const isQueryValid = validateQueryFunction(queryParams);
      if (!isQueryValid) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid query parameters", path: event.path, query: event.queryStringParameters })
        );
      }

      let limit = OccupationAPISpecs.Constants.DEFAULT_LIMIT;
      if (queryParams.limit) {
        limit = queryParams.limit;
      }

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

      const occupation = await this.occupationService.findById(id);
      if (!occupation) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "occupation not found",
          `No occupation found with id: ${id}`
        );
      }

      const children = await this.occupationService.getChildren(modelId, id, decodedCursor?.id, limit);

      let nextCursor: string | null = null;
      if (children?.nextCursor?._id) {
        nextCursor = this.encodeCursor(children.nextCursor._id, children.nextCursor.createdAt);
      }
      // Use transformPaginatedRelation to handle mixed Occupation/OccupationGroup children
      return responseJSON(
        StatusCodes.OK,
        transformPaginatedRelation(children.items, getResourcesBaseUrl(), limit, nextCursor)
      );
    } catch (error: unknown) {
      console.error("Failed to get children:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the occupation children from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Enums.GET.Response.Status500.Children.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_CHILDREN,
        "Failed to retrieve the occupation children from the DB",
        ""
      );
    }
  }

  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}/skills:
   *  get:
   *   operationId: GETOccupationSkills
   *   tags:
   *    - occupations
   *   summary: Get the skills of an occupation.
   *   description: Retrieve the skills required by a specific occupation in a taxonomy model.
   *   security:
   *    - api_key: []
   *    - jwt_auth: []
   *   parameters:
   *    - in: path
   *      name: modelId
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/OccupationRequestByIdParamSchemaGET/properties/modelId'
   *    - in: path
   *      name: id
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/OccupationRequestByIdParamSchemaGET/properties/id'
   *    - in: query
   *      name: limit
   *      required: false
   *      schema:
   *        $ref: '#/components/schemas/OccupationSkillsRequestQueryParamSchemaGET/properties/limit'
   *    - in: query
   *      name: cursor
   *      schema:
   *        $ref: '#/components/schemas/OccupationSkillsRequestQueryParamSchemaGET/properties/cursor'
   *   responses:
   *     '200':
   *       description: Successfully retrieved the skills.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/OccupationResponseSchemaGETSkills'
   *     '400':
   *       description: |
   *         Failed to retrieve the skills. Additional information can be found in the response body.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Occupation or model not found.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETOccupationSkills404ErrorSchema'
   *     '500':
   *       description: |
   *         The server encountered an unexpected condition.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getSkills(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.OCCUPATION_SKILLS_ROUTE).regexp.exec(pathToMatch);
      if (!execMatch) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          "Route did not match",
          ""
        );
      }
      const modelId = execMatch[1];
      const id = execMatch[2];

      const requestPathParameter = { modelId, id };
      const validatePathFunction = ajvInstance.getSchema(
        OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id as string
      ) as ValidateFunction<OccupationAPISpecs.Types.GET.Request.Detail.Param.Payload>;

      const isValidPathParameter = validatePathFunction(requestPathParameter);
      if (!isValidPathParameter) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({
            reason: "Invalid modelId or occupation Id",
            path: event.path,
            pathParameters: event.pathParameters,
          })
        );
      }

      const validationResult = await this.occupationService.validateModelForOccupation(modelId);
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${modelId}`
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Enums.GET.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const rawQueryParams = event.queryStringParameters || {};
      const queryParams: OccupationAPISpecs.Types.GET.Skills.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor ?? undefined,
      };

      const validateQueryFunction = ajvInstance.getSchema(
        OccupationAPISpecs.Schemas.GET.Skills.Request.Query.Payload.$id as string
      ) as ValidateFunction<OccupationAPISpecs.Types.GET.Skills.Request.Query.Payload>;

      const isQueryValid = validateQueryFunction(queryParams);
      if (!isQueryValid) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid query parameters", path: event.path, query: event.queryStringParameters })
        );
      }

      let limit = OccupationAPISpecs.Constants.DEFAULT_LIMIT;
      if (queryParams.limit) {
        limit = queryParams.limit;
      }

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

      const occupation = await this.occupationService.findById(id);
      if (!occupation) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Enums.GET.Response.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "occupation not found",
          `No occupation found with id: ${id}`
        );
      }

      const result = await this.occupationService.getSkills(modelId, id, decodedCursor?.id, limit);

      let nextCursor: string | null = null;
      if (result?.nextCursor?._id) {
        nextCursor = this.encodeCursor(result.nextCursor._id, result.nextCursor.createdAt);
      }
      return responseJSON(
        StatusCodes.OK,
        transformPaginatedSkills(result.items, getResourcesBaseUrl(), limit, nextCursor)
      );
    } catch (error: unknown) {
      console.error("Failed to get skills:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the occupation skills from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Enums.GET.Response.Status500.Skills.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_SKILLS,
        "Failed to retrieve the occupation skills from the DB",
        ""
      );
    }
  }
}
