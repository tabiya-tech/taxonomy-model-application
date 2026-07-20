import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import SkillGroupPOSTAPISpecs from "api-specifications/esco/skillGroup/POST";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance, ParseValidationError } from "validator";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponsePOST, responseJSON, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { INewSkillGroupSpecWithoutImportId, ModelForSkillGroupValidationErrorCode } from "../_shared/skillGroup.types";
import { parsePath } from "common/parsePath/parsePath";
import { Routes } from "routes.constant";
import { ISkillGroupService, SkillGroupModelValidationError } from "../services/skillGroup.service.type";
import { transform } from "./response";

export class SkillGroupCreateController {
  private readonly skillGroupService: ISkillGroupService;

  constructor() {
    this.skillGroupService = getServiceRegistry().skillGroup;
  }
  /**
   * @openapi
   *
   * /models/{modelId}/skillGroups:
   *    post:
   *      operationId: POSTSkillGroup
   *      tags:
   *        - skillGroups
   *      summary: Create a new taxonomy skill group.
   *      description: Create a new taxonomy skill group in a specific taxonomy model.
   *      security:
   *       - api_key: []
   *       - jwt_auth: []
   *      parameters:
   *        - in: path
   *          name: modelId
   *          required: true
   *          schema:
   *            $ref: '#/components/schemas/SkillGroupRequestParamSchemaGET/properties/modelId'
   *      requestBody:
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SkillGroupRequestSchemaPOST'
   *         required: true
   *      responses:
   *         '201':
   *           description: Successfully created the skill group,
   *           content:
   *             application/json:
   *               schema:
   *                  $ref: '#/components/schemas/SkillGroupResponseSchemaPOST'
   *         '400':
   *           description: |
   *             Failed to create the skill group. Additional information can be found in the response body.
   *           content:
   *             application/json:
   *                schema:
   *                  $ref: '#/components/schemas/POSTSkillGroup400ErrorSchema'
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
  async postSkillGroup(event: APIGatewayProxyEvent) {
    if (!event.headers["Content-Type"]?.includes("application/json")) {
      return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
    }

    //@ts-ignore
    if (event.body?.length > SkillGroupAPISpecs.POST.Constants.MAX_PAYLOAD_LENGTH) {
      return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
        `Expected maximum length is ${SkillGroupAPISpecs.POST.Constants.MAX_PAYLOAD_LENGTH}`
      );
    }

    let payload: SkillGroupAPISpecs.POST.Types.Request.Payload;

    try {
      payload = JSON.parse(event.body as string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(error.message);
    }

    const validateFunction = ajvInstance.getSchema(
      SkillGroupPOSTAPISpecs.Schemas.Request.Payload.$id as string
    ) as ValidateFunction;

    const isValid = validateFunction(payload);
    if (!isValid) {
      const errorDetail = ParseValidationError(validateFunction.errors);
      return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
    }

    const { modelId: resolvedModelId } = parsePath<{ modelId?: string }>(Routes.SKILL_GROUPS_ROUTE, event.path);
    if (!resolvedModelId) {
      return errorResponsePOST(
        StatusCodes.BAD_REQUEST,
        SkillGroupPOSTAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP,
        "modelId is missing in the path",
        JSON.stringify({ path: event.path, pathParameters: event.pathParameters })
      );
    }

    if (payload.modelId !== resolvedModelId) {
      return errorResponsePOST(
        StatusCodes.BAD_REQUEST,
        SkillGroupPOSTAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${resolvedModelId}`
      );
    }

    const newSkillGroupSpec: INewSkillGroupSpecWithoutImportId = {
      originUri: payload.originUri,
      code: payload.code,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      description: payload.description,
      scopeNote: payload.scopeNote,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
    };

    try {
      const newSkillGroup = await this.skillGroupService.create(newSkillGroupSpec);
      return responseJSON(StatusCodes.CREATED, transform(newSkillGroup, getResourcesBaseUrl()));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      errorLoggerInstance.logError("Failed to create skill group in the DB", error.name);
      if (error instanceof SkillGroupModelValidationError) {
        switch (error.code) {
          case ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponsePOST(
              StatusCodes.NOT_FOUND,
              SkillGroupPOSTAPISpecs.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponsePOST(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillGroupPOSTAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP,
              "Failed to fetch the model detail from the DB",
              ""
            );
          case ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponsePOST(
              StatusCodes.BAD_REQUEST,
              SkillGroupPOSTAPISpecs.Enums.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Model is released and cannot be modified",
              ""
            );
          default:
            return errorResponsePOST(
              StatusCodes.INTERNAL_SERVER_ERROR,
              SkillGroupPOSTAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP,
              "Failed to create the skill group in the DB",
              ""
            );
        }
      }
      return errorResponsePOST(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillGroupPOSTAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_GROUP,
        "Failed to create the skill group in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillGroupCreateController().postSkillGroup(event);
};
