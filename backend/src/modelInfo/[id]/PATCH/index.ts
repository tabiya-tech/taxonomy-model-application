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
import { IModelInfo } from "modelInfo/modelInfo.types";

/**
 * @openapi
 *
 * /models/{modelId}:
 *     patch:
 *       operationId: PATCHModel
 *       tags:
 *         - model
 *       summary: Release a taxonomy model or add languages to it.
 *       description: |
 *         Patch a taxonomy model. A request must ask for at least one of the following, and it may ask for both:
 *
 *         - `released`: release the model. Once released, the model's ESCO entities become read-only and the model
 *           becomes visible to all users, not just model managers. This endpoint can only be used to release a
 *           model; it cannot be used to un-release one.
 *         - `availableLanguages`: the full list of the translation languages the model carries data in. It may add
 *           languages to the ones the model already declares, it may not drop any of them: removing a language is
 *           out of scope and a request that does not carry every language of the model is rejected with a 400.
 *           These languages are orthogonal to the `locale` of the model, the country or the market it describes,
 *           which this endpoint cannot change.
 *
 *         No other model field can be edited through this endpoint.
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
 *               $ref: '#/components/schemas/ModelInfoRequestSchemaPATCH'
 *         required: true
 *       responses:
 *         '200':
 *           description: Successfully patched the model.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ModelInfoResponseSchemaPATCH'
 *         '400':
 *           description: |
 *             Failed to patch the model, e.g. because the request drops a language the model carries data in.
 *             Additional information can be found in the response body.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PATCHModel400ErrorSchema'
 *         '401':
 *           $ref: '#/components/responses/UnAuthorizedResponse'
 *         '403':
 *           $ref: '#/components/responses/ForbiddenResponse'
 *         '404':
 *           description: The model was not found.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PATCHModel404ErrorSchema'
 *         '409':
 *           description: The model is already released.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PATCHModel409ErrorSchema'
 *         '415':
 *           $ref: '#/components/responses/AcceptOnlyJSONResponse'
 *         '500':
 *           $ref: '#/components/responses/InternalServerErrorResponse'
 */
export class ModelPATCHHandler {
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const validationResult = validateEvent<ModelInfoAPISpecs.ModelInfo.PATCH.Types.Request.Payload>(
      event,
      ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload,
      ModelInfoAPISpecs.ModelInfo.PATCH.Constants.MAX_PATCH_PAYLOAD_LENGTH
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
    // What the caller is told when the DB fails depends on what it asked for: a release, or a change of the
    // languages the model carries data in.
    const dbFailure = payload.released
      ? {
          errorCode: ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RELEASE_MODEL,
          message: "Failed to release the model in the DB",
        }
      : {
          errorCode:
            ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes
              .DB_FAILED_TO_UPDATE_AVAILABLE_LANGUAGES,
          message: "Failed to update the available languages of the model in the DB",
        };

    try {
      let patchedModel: IModelInfo | null = null;

      if (payload.availableLanguages !== undefined) {
        const requestedLanguages = payload.availableLanguages;
        const currentModel = await modelRepository.getModelById(modelId);
        if (currentModel === null) {
          return this.modelNotFound(modelId);
        }
        const droppedLanguages = currentModel.availableLanguages.filter(
          (shortCode) => !requestedLanguages.includes(shortCode)
        );
        if (droppedLanguages.length > 0) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status400.ErrorCodes
              .AVAILABLE_LANGUAGES_REMOVAL_NOT_SUPPORTED,
            "Removing an available language of a model is not supported",
            `The model still carries data for the languages: ${droppedLanguages.join(", ")}`
          );
        }
        // The release is checked here, before the languages are written, so that a request that asks for both does
        // not leave the languages changed behind when the model cannot be released. It stays a check and not a lock,
        // only releaseModel() below is atomic.
        if (payload.released && currentModel.released) {
          return this.modelAlreadyReleased(modelId);
        }
        patchedModel = await modelRepository.updateAvailableLanguages(modelId, requestedLanguages);
        if (patchedModel === null) {
          return this.modelNotFound(modelId);
        }
      }

      if (payload.released) {
        // A null result means the model doesn't exist or is already released; fetch it to tell those apart.
        const releasedModel = await modelRepository.releaseModel(modelId, payload.releaseNotes);
        if (releasedModel === null) {
          const existingModel = await modelRepository.getModelById(modelId);
          if (existingModel === null) {
            return this.modelNotFound(modelId);
          }
          return this.modelAlreadyReleased(modelId);
        }
        patchedModel = releasedModel;
      }

      // The request schema requires at least one of released / availableLanguages, so by now the model is patched.
      const updatedModel = patchedModel as IModelInfo;
      const uuidHistoryDetails = await modelRepository.getHistory(updatedModel.UUIDHistory);

      return responseJSON(StatusCodes.OK, transform(updatedModel, getResourcesBaseUrl(), uuidHistoryDetails));
    } catch (error: unknown) {
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      console.error(new Error(dbFailure.message, { cause: error }));
      return errorResponse(StatusCodes.INTERNAL_SERVER_ERROR, dbFailure.errorCode, dbFailure.message, "");
    }
  }

  private modelNotFound(modelId: string): APIGatewayProxyResult {
    return errorResponse(
      StatusCodes.NOT_FOUND,
      ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID,
      "Model not found",
      `No model found with id: ${modelId}`
    );
  }

  private modelAlreadyReleased(modelId: string): APIGatewayProxyResult {
    return errorResponse(
      StatusCodes.CONFLICT,
      ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status409.ErrorCodes.MODEL_ALREADY_RELEASED,
      "The model is already released",
      `Model with id ${modelId} is already released and cannot be released again`
    );
  }
}
