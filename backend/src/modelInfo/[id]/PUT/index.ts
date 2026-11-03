import mongoose from "mongoose";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import ErrorAPISpecs from "api-specifications/error";
import AuthAPISpecs from "api-specifications/auth";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { validateEvent } from "common/validations/validateRequest";
import { parsePath } from "common/parsePath/parsePath";
import { RoleRequired } from "auth/authorizer";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { transform } from "modelInfo/transform";
import { IUpdateModelInfoSpec } from "modelInfo/modelInfo.types";

/**
 * @openapi
 *
 * /models/{modelId}:
 *     put:
 *       operationId: PUTModel
 *       tags:
 *         - model
 *       summary: Fully replace a taxonomy model's editable metadata.
 *       description: |
 *         Replace all editable metadata of a taxonomy model. The request must carry every one of:
 *         `name`, `description`, `locale`, `availableLanguages`, `license` and `UUIDHistory`.
 *
 *         A released model is an immutable published snapshot. This endpoint cannot change any of those six fields
 *         on a released model, and it cannot un-release a model.
 *
 *         `availableLanguages` is the full list of the translation languages the model carries data in. It may add
 *         languages to the ones the model already declares, it may not drop any of them: removing a language is
 *         out of scope and a request that does not carry every language of the model is rejected with a 400.
 *
 *         `UUIDHistory` must include the model's current UUID. That check is applied after the model is loaded.
 *       security:
 *        - api_key: []
 *        - jwt_auth: []
 *       parameters:
 *         - in: path
 *           name: modelId
 *           required: true
 *           schema:
 *             type: string
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelInfoRequestSchemaPUT'
 *         required: true
 *       responses:
 *         '200':
 *           description: Successfully replaced the model metadata.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ModelInfoResponseSchemaPUT'
 *         '400':
 *           description: |
 *             Failed to replace the model, e.g. because the request drops a language the model carries data in,
 *             or because UUIDHistory does not include the model's current UUID.
 *             Additional information can be found in the response body.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PUTModel400ErrorSchema'
 *         '401':
 *           $ref: '#/components/responses/UnAuthorizedResponse'
 *         '403':
 *           $ref: '#/components/responses/ForbiddenResponse'
 *         '404':
 *           description: The model was not found.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PUTModel404ErrorSchema'
 *         '409':
 *           description: The model is released and cannot be replaced.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PUTModel409ErrorSchema'
 *         '415':
 *           $ref: '#/components/responses/AcceptOnlyJSONResponse'
 *         '500':
 *           $ref: '#/components/responses/InternalServerErrorResponse'
 */
export class ModelPUTHandler {
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const validationResult = validateEvent<ModelInfoAPISpecs.ModelInfo.PUT.Types.Request.Payload>(
      event,
      ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload,
      ModelInfoAPISpecs.ModelInfo.PUT.Constants.MAX_PUT_PAYLOAD_LENGTH
    );
    if (validationResult.errorResponse) {
      return validationResult.errorResponse;
    }
    const payload = validationResult.payload;

    const { modelId } = parsePath<{ modelId?: string }>(Routes.MODEL_ROUTE, event.path);
    if (!modelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        "modelId is missing in the path",
        JSON.stringify({ path: event.path })
      );
    }

    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      return this.modelNotFound(modelId);
    }

    const modelRepository = getRepositoryRegistry().modelInfo;

    try {
      const currentModel = await modelRepository.getModelById(modelId);
      if (currentModel === null) {
        return this.modelNotFound(modelId);
      }
      if (currentModel.released) {
        return this.modelIsReleased(modelId);
      }

      if (!payload.UUIDHistory.includes(currentModel.UUID)) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status400.ErrorCodes.UUID_HISTORY_MISSING_CURRENT_UUID,
          "UUIDHistory must include the current UUID of the model",
          `The UUIDHistory does not include the current UUID ${currentModel.UUID} of model ${modelId}`
        );
      }

      const droppedLanguages = currentModel.availableLanguages.filter(
        (shortCode) => !payload.availableLanguages.includes(shortCode)
      );
      if (droppedLanguages.length > 0) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status400.ErrorCodes.AVAILABLE_LANGUAGES_REMOVAL_NOT_SUPPORTED,
          "Removing an available language of a model is not supported",
          `The model still carries data for the languages: ${droppedLanguages.join(", ")}`
        );
      }

      const update: IUpdateModelInfoSpec = {
        name: payload.name,
        description: payload.description,
        locale: payload.locale,
        availableLanguages: payload.availableLanguages,
        license: payload.license,
        UUIDHistory: payload.UUIDHistory,
      };

      const replacedModel = await modelRepository.replaceModel(modelId, update);
      if (replacedModel === null) {
        const existingModel = await modelRepository.getModelById(modelId);
        if (existingModel === null) {
          return this.modelNotFound(modelId);
        }
        if (existingModel.released) {
          return this.modelIsReleased(modelId);
        }
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_MODEL,
          "Failed to update the model in the DB",
          ""
        );
      }

      const uuidHistoryDetails = await modelRepository.getHistory(replacedModel.UUIDHistory);
      return responseJSON(StatusCodes.OK, transform(replacedModel, getResourcesBaseUrl(), uuidHistoryDetails));
    } catch (error: unknown) {
      console.error(new Error("Failed to update the model in the DB", { cause: error }));
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_MODEL,
        "Failed to update the model in the DB",
        ""
      );
    }
  }

  private modelNotFound(modelId: string): APIGatewayProxyResult {
    return errorResponse(
      StatusCodes.NOT_FOUND,
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID,
      "Model not found",
      `No model found with id: ${modelId}`
    );
  }

  private modelIsReleased(modelId: string): APIGatewayProxyResult {
    return errorResponse(
      StatusCodes.CONFLICT,
      ModelInfoAPISpecs.ModelInfo.PUT.Enums.Response.Status409.ErrorCodes.MODEL_IS_RELEASED,
      "The model is released",
      `Model with id ${modelId} is released and cannot be replaced`
    );
  }
}
