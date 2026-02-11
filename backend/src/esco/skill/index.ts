import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  errorResponse,
  errorResponseGET,
  responseJSON,
  HTTP_VERBS,
  StatusCodes,
  STD_ERRORS_RESPONSES,
} from "server/httpUtils";
import { ajvInstance } from "validator";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { ValidateFunction } from "ajv";
import {
  transform,
  transformPaginated,
  transformPaginatedRelation,
  transformPaginatedOccupations,
  transformPaginatedRelated,
} from "./transform";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import ErrorAPISpecs from "api-specifications/error";
import { pathToRegexp } from "path-to-regexp";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ISkillService } from "./skillService.type";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  const skillController = new SkillController();
  if (event?.httpMethod === HTTP_VERBS.GET) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.SKILL_PARENTS_ROUTE).regexp.exec(pathToMatch)) {
      return skillController.getParents(event);
    } else if (pathToRegexp(Routes.SKILL_CHILDREN_ROUTE).regexp.exec(pathToMatch)) {
      return skillController.getChildren(event);
    } else if (pathToRegexp(Routes.SKILL_OCCUPATIONS_ROUTE).regexp.exec(pathToMatch)) {
      return skillController.getOccupations(event);
    } else if (pathToRegexp(Routes.SKILL_RELATED_ROUTE).regexp.exec(pathToMatch)) {
      return skillController.getRelatedSkills(event);
    } else {
      const individualMatch = pathToRegexp(Routes.SKILL_ROUTE).regexp.exec(pathToMatch);
      return individualMatch ? skillController.getSkill(event) : skillController.getSkills(event);
    }
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

export class SkillController {
  private readonly skillService: ISkillService;
  constructor() {
    this.skillService = getServiceRegistry().skill;
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
   * /models/{modelId}/skills:
   *   get:
   *    operationId: GETSkills
   *    tags:
   *      - skills
   *    summary: Get a list of paginated skills and cursor if there is one in a taxonomy model.
   *    description: Retrieve a list of paginated skills in a specific taxonomy model.
   *    security:
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestParamSchemaGET/properties/modelId'
   *      - in: query
   *        name: limit
   *        required: false
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestQueryParamSchemaGET/properties/limit'
   *      - in: query
   *        name: cursor
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestQueryParamSchemaGET/properties/cursor'
   *    responses:
   *      '200':
   *        description: Successfully retrieved the paginated skills.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/SkillResponseSchemaGET'
   *      '400':
   *        description: |
   *          Failed to retrieve the skills. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkill400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '404':
   *        description: Model not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkills404ErrorSchema'
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
  async getSkills(event: APIGatewayProxyEvent) {
    try {
      // extract the modelId from the pathParameters
      // NOTE: Since we're using a single '{proxy+}' resource in API Gateway path params
      // like `{modelId}` are not populated under `pathParameters` instead, the full path is put in
      // `pathParameters.proxy` and `event.path`. To support both setups (explicit param resource and proxy),
      // we fallback to parse the `event.path` if `pathParameters.modelId` is absent.
      const modelIdFromParams = event.pathParameters?.modelId;
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.SKILLS_ROUTE).regexp.exec(pathToMatch);
      const resolvedModelId = modelIdFromParams ?? (execMatch ? execMatch[1] : undefined);
      if (!resolvedModelId) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          SkillAPISpecs.Enums.GET.List.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILLS,
          "modelId is missing in the path",
          JSON.stringify({ path: event.path, pathParameters: event.pathParameters, query: event.queryStringParameters })
        );
      }

      const requestPathParameter: SkillAPISpecs.Types.GET.Request.Param.Payload = {
        modelId: resolvedModelId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        SkillAPISpecs.Schemas.GET.Request.Param.Payload.$id as string
      ) as ValidateFunction<SkillAPISpecs.Types.GET.Request.Param.Payload>;
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
      const queryParams: SkillAPISpecs.Types.GET.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor,
      };

      const validateQueryFunction = ajvInstance.getSchema(
        SkillAPISpecs.Schemas.GET.Request.Query.Payload.$id as string
      ) as ValidateFunction<SkillAPISpecs.Types.GET.Request.Query.Payload>;
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
      // here call the service to get the skills by limit starting from the cursor
      const currentPageSkills = await this.skillService.findPaginated(
        requestPathParameter.modelId,
        decodedCursor,
        limit
      );

      let nextCursor: string | null = null;
      if (currentPageSkills?.nextCursor?._id) {
        nextCursor = this.encodeCursor(currentPageSkills.nextCursor._id, currentPageSkills.nextCursor.createdAt);
      }
      return responseJSON(
        StatusCodes.OK,
        transformPaginated(currentPageSkills.items, getResourcesBaseUrl(), limit, nextCursor)
      );
    } catch (error: unknown) {
      console.error("Failed to retrieve skills:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the skills from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Enums.GET.List.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILLS,
        "Failed to retrieve the skills from the DB",
        ""
      );
    }
  }

  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}:
   *  get:
   *   operationId: GETSkillById
   *   tags:
   *    - skills
   *   summary: Get a skill by its identifier in a taxonomy model.
   *   description: Retrieve a skill by its unique identifier in a specific taxonomy model.
   *   security:
   *    - jwt_auth: []
   *   parameters:
   *    - in: path
   *      name: modelId
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/SkillRequestByIdParamSchemaGET/properties/modelId'
   *    - in: path
   *      name: id
   *      required: true
   *      schema:
   *        $ref: '#/components/schemas/SkillRequestByIdParamSchemaGET/properties/id'
   *   responses:
   *     '200':
   *       description: Successfully retrieved the skill.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SkillResponseSchemaGETById'
   *     '401':
   *       $ref: '#/components/responses/UnAuthorizedResponse'
   *     '404':
   *       description: Skill not found.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GETSkill404ErrorSchema'
   *     '500':
   *       description: |
   *         The server encountered an unexpected condition.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getSkill(event: APIGatewayProxyEvent) {
    try {
      const idFromParams = event.pathParameters?.id;
      const modelIdFromParams = event.pathParameters?.modelId;
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.SKILL_ROUTE).regexp.exec(pathToMatch);
      const resolvedSkillId = idFromParams ?? (execMatch ? execMatch[2] : "");
      const resolvedModelId = modelIdFromParams ?? (execMatch ? execMatch[1] : "");

      const requestPathParameter: SkillAPISpecs.Types.GET.Request.Detail.Param.Payload = {
        modelId: resolvedModelId,
        id: resolvedSkillId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id as string
      ) as ValidateFunction<SkillAPISpecs.Types.GET.Request.Detail.Param.Payload>;

      const isValidPathParameter = validatePathFunction(requestPathParameter);
      if (!isValidPathParameter) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({
            reason: "Invalid modelId or skill Id",
            path: event.path,
            pathParameters: event.pathParameters,
          })
        );
      }

      const skill = await this.skillService.findById(requestPathParameter.id);
      if (!skill) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.Enums.GET.ById.Response.Status404.ErrorCodes.SKILL_NOT_FOUND,
          "skill not found",
          `No skill found with id: ${requestPathParameter.id}`
        );
      }
      return responseJSON(StatusCodes.OK, transform(skill, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to get skill by id:", error);
      errorLoggerInstance.logError(
        "Failed to retrieve the skill from the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Enums.GET.ById.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL,
        "Failed to retrieve the skill from the DB",
        ""
      );
    }
  }

  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getParents(event: APIGatewayProxyEvent) {
    try {
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.SKILL_PARENTS_ROUTE).regexp.exec(pathToMatch);
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

      const parents = await this.skillService.getParents(modelId, id);
      return responseJSON(StatusCodes.OK, transformPaginatedRelation(parents, getResourcesBaseUrl(), 100, null));
    } catch (error: unknown) {
      console.error("Failed to get parents:", error);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Enums.Relations.Parents.GET.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_SKILL_PARENTS as unknown as ErrorAPISpecs.Types.GET["errorCode"],
        "Failed to retrieve the skill parents from the DB",
        ""
      );
    }
  }

  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getChildren(event: APIGatewayProxyEvent) {
    try {
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.SKILL_CHILDREN_ROUTE).regexp.exec(pathToMatch);
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

      const children = await this.skillService.getChildren(modelId, id);
      return responseJSON(StatusCodes.OK, transformPaginatedRelation(children, getResourcesBaseUrl(), 100, null));
    } catch (error: unknown) {
      console.error("Failed to get children:", error);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Enums.Relations.Children.GET.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_SKILL_CHILDREN as unknown as ErrorAPISpecs.Types.GET["errorCode"],
        "Failed to retrieve the skill children from the DB",
        ""
      );
    }
  }

  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getOccupations(event: APIGatewayProxyEvent) {
    try {
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.SKILL_OCCUPATIONS_ROUTE).regexp.exec(pathToMatch);
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

      const occupations = await this.skillService.getOccupations(modelId, id);
      return responseJSON(StatusCodes.OK, transformPaginatedOccupations(occupations, 100, null));
    } catch (error: unknown) {
      console.error("Failed to get occupations:", error);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Enums.Relations.Occupations.GET.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_SKILL_OCCUPATIONS as unknown as ErrorAPISpecs.Types.GET["errorCode"],
        "Failed to retrieve the skill occupations from the DB",
        ""
      );
    }
  }

  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getRelatedSkills(event: APIGatewayProxyEvent) {
    try {
      const pathToMatch = event.path || "";
      const execMatch = pathToRegexp(Routes.SKILL_RELATED_ROUTE).regexp.exec(pathToMatch);
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

      const relatedSkills = await this.skillService.getRelatedSkills(modelId, id);
      return responseJSON(StatusCodes.OK, transformPaginatedRelated(relatedSkills, 100, null));
    } catch (error: unknown) {
      console.error("Failed to get related skills:", error);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Enums.Relations.Related.GET.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_RELATED_SKILLS as unknown as ErrorAPISpecs.Types.GET["errorCode"],
        "Failed to retrieve the related skills from the DB",
        ""
      );
    }
  }
}
