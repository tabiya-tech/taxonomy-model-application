import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, HTTP_VERBS, responseJSON, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ajvInstance, ParseValidationError } from "validator";
import AuthAPISpecs from "api-specifications/auth";

import ModelInfoAPISpecs from "api-specifications/modelInfo";

import { ValidateFunction } from "ajv";
import { transform } from "./transform";
import { getResourcesBaseUrl } from "server/config/config";
import { IModelInfo, INewModelInfoSpec } from "./modelInfo.types";
import { checkRole, RoleRequired } from "../auth/authenticator";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  const modelController = new ModelController();
  //POST /modelInfo
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return modelController.postModelInfo(event);
  } else if (event?.httpMethod === HTTP_VERBS.GET) {
    return modelController.getModelInfo(event);
  }

  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

class ModelController {
  /**
   * @openapi
   *
   * /models:
   *     post:
   *       operationId: POSTModel
   *       tags:
   *         - model
   *       summary: Create a new taxonomy model.
   *       description: Create a new taxonomy model that can be used to import data into it.
   *       security:
   *        - jwt_auth: []
   *       requestBody:
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ModelInfoRequestSchemaPOST'
   *         required: true
   *       responses:
   *         '201':
   *           description: Successfully created the model,
   *           content:
   *             application/json:
   *               schema:
   *                  $ref: '#/components/schemas/ModelInfoResponseSchemaPOST'
   *         '400':
   *           description: |
   *             Failed to create the model. Additional information can be found in the response body.
   *           content:
   *             application/json:
   *               schema:
   *                 $ref: '#/components/schemas/ErrorSchema'
   *         '415':
   *           $ref: '#/components/responses/AcceptOnlyJSONResponse'
   *         '500':
   *           $ref: '#/components/responses/InternalServerErrorResponse'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async postModelInfo(event: APIGatewayProxyEvent) {
    if (!event.headers["Content-Type"]?.includes("application/json")) {
      // application/json;charset=UTF-8
      return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
    }

    // @ts-ignore
    if (event.body?.length > ModelInfoAPISpecs.Constants.MAX_PAYLOAD_LENGTH) {
      return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
        `Expected maximum length is ${ModelInfoAPISpecs.Constants.MAX_PAYLOAD_LENGTH}`
      );
    }

    let payload: ModelInfoAPISpecs.Types.POST.Request.Payload;
    try {
      payload = JSON.parse(event.body as string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(error.message);
    }
    const validateFunction = ajvInstance.getSchema(
      ModelInfoAPISpecs.Schemas.POST.Request.Payload.$id as string
    ) as ValidateFunction;
    const isValid = validateFunction(payload);
    if (!isValid) {
      const errorDetail = ParseValidationError(validateFunction.errors);
      return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
    }

    const newModelInfoSpec: INewModelInfoSpec = {
      name: payload.name,
      description: payload.description,
      locale: payload.locale,
      UUIDHistory: payload.UUIDHistory,
    };

    try {
      const newModelInfo = await getRepositoryRegistry().modelInfo.create(newModelInfoSpec);
      const uuidHistoryDetails = await getRepositoryRegistry().modelInfo.getHistory(newModelInfo.UUIDHistory);

      return responseJSON(StatusCodes.CREATED, transform(newModelInfo, getResourcesBaseUrl(), uuidHistoryDetails));
    } catch (error: unknown) {
      //
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ModelInfoAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_MODEL,
        "Failed to create the model in the DB",
        ""
      );
    }
  }

  /**
   * @openapi
   *
   * /models:
   *   get:
   *     operationId: GETModel
   *     tags:
   *       - model
   *     summary: Get a taxonomy model information
   *     description: Retrieve information about a specific taxonomy model.
   *     security:
   *        - jwt_auth: []
   *     responses:
   *       '200':
   *         description: Successfully retrieved the taxonomy model information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ModelInfoResponseSchemaGET'
   *       '500':
   *         description: Internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorSchema'
   */

  // Currently we do not need the event
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getModelInfo(event: APIGatewayProxyEvent) {
    try {
      const isModelManager = checkRole(event, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

      const models: IModelInfo[] = await getRepositoryRegistry().modelInfo.getModels();
      const modelsMap = new Map(models.map((model) => [model.UUID, model]));

      // map through the models and get the UUIDHistory details without hitting the DB again
      let modelsWithDetails = models.map((model) => {
        const uuidHistoryDetails = model.UUIDHistory.map((uuid: string) => {
          const modelInfo = modelsMap.get(uuid);
          if (modelInfo) {
            return {
              id: modelInfo.id,
              UUID: modelInfo.UUID,
              name: modelInfo.name,
              version: modelInfo.version,
              localeShortCode: modelInfo.locale.shortCode,
            };
          } else {
            return {
              id: null,
              UUID: uuid,
              name: null,
              version: null,
              localeShortCode: null,
            };
          }
        });
        return transform(model, getResourcesBaseUrl(), uuidHistoryDetails);
      });

      // filter based on roles.
      if (!isModelManager) {
        modelsWithDetails = modelsWithDetails.filter((model) => model.released);
      }

      return responseJSON(StatusCodes.OK, modelsWithDetails);
    } catch (error: unknown) {
      //
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ModelInfoAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_MODELS,
        "Failed to retrieve models from the DB",
        ""
      );
    }
  }
}
