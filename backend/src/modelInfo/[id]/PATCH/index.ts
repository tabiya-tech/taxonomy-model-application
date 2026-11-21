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
 *     patch:
 *       operationId: PATCHModel
 *       tags:
 *         - model
 *       summary: Partially update a taxonomy model or release it.
 *       description: |
 *         Patch a taxonomy model. This endpoint supports true partial updates: only supplied fields are updated;
 *         omitted fields remain unchanged. A request must supply at least one of the following editable fields:
 *
 *         - `name`: the display name of the model (non-empty string, max 256 chars).
 *         - `description`: a detailed description of the model (max 6,000 chars, may be empty string).
 *         - `locale`: the locale (country / market) describing the model.
 *         - `license`: the license text or identifier (max 100,000 chars, may be empty string).
 *         - `UUIDHistory`: the full UUID history of the model (1–10,000 unique UUIDs). When supplied, it must include
 *           the model's current UUID; omitting the current UUID is rejected with a 400.
 *         - `availableLanguages`: the full list of translation languages the model carries data in. It may add
 *           languages to the ones the model already declares, but it may not drop any of them; dropping a language
 *           is rejected with a 400. Available languages may still be added to an already released model.
 *         - `released`: set to `true` to release the model. Once released, the model's ESCO entities become read-only,
 *           its metadata fields become immutable, and the model becomes visible to all users. This endpoint cannot be
 *           used to un-release a model (released: false is rejected). Setting released: true on an already released
 *           model returns 409.
 *         - `releaseNotes`: optional release notes (max 100,000 chars) recorded alongside the release. Only valid
 *           when `released: true` is also supplied.
 *
 *         Metadata fields (`name`, `description`, `locale`, `license`, `UUIDHistory`) cannot be changed on an already
 *         released model; attempts to do so return a 409 CONFLICT.
 *
 *         When `released: true` is supplied together with metadata or language changes, all changes and the release
 *         are applied atomically in a single operation.
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
 *             Failed to patch the model, e.g. because the request drops a language the model carries data in,
 *             UUIDHistory does not include the current model UUID, releaseNotes was provided without released: true,
 *             or payload validation failed. Additional information can be found in the response body.
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
 *           description: |
 *             The model is already released, or it was concurrently modified while updating available languages.
 *             In the latter case, fetch the model's current state and retry the request.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PATCHModel409ErrorSchema'
 *         '415':
 *           $ref: '#/components/responses/AcceptOnlyJSONResponse'
 *         '500':
 *           description: Internal Server Error.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PATCHModel500ErrorSchema'
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

    const hasMetadataChange =
      payload.name !== undefined ||
      payload.description !== undefined ||
      payload.locale !== undefined ||
      payload.license !== undefined ||
      payload.UUIDHistory !== undefined;

    // What the caller is told when the DB fails depends on what was updated.
    const isReleaseOnly = payload.released && !hasMetadataChange && payload.availableLanguages === undefined;
    const isLanguageOnly = payload.availableLanguages !== undefined && !hasMetadataChange && !payload.released;
    const dbFailure = isReleaseOnly
      ? {
          errorCode: ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RELEASE_MODEL,
          message: "Failed to release the model in the DB",
        }
      : isLanguageOnly
      ? {
          errorCode:
            ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes
              .DB_FAILED_TO_UPDATE_AVAILABLE_LANGUAGES,
          message: "Failed to update the available languages of the model in the DB",
        }
      : {
          errorCode: ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_PATCH_MODEL,
          message: "Failed to patch the model in the DB",
        };

    try {
      const currentModel = await modelRepository.getModelById(modelId);
      if (currentModel === null) {
        return this.modelNotFound(modelId);
      }

      // Metadata changes and re-releasing are forbidden on already released models.
      // (Language additions on released models are permitted.)
      if (currentModel.released) {
        if (hasMetadataChange || payload.released) {
          return this.modelAlreadyReleased(modelId);
        }
      }

      // When UUIDHistory is supplied, it must include the current model's UUID.
      if (payload.UUIDHistory !== undefined && !payload.UUIDHistory.includes(currentModel.UUID)) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status400.ErrorCodes.UUID_HISTORY_MUST_INCLUDE_CURRENT_UUID,
          "UUIDHistory must include the current model UUID",
          `The current model UUID '${currentModel.UUID}' was not found in the provided UUIDHistory`
        );
      }

      // When availableLanguages is supplied, it cannot remove any language already recorded on the model.
      if (payload.availableLanguages !== undefined) {
        const droppedLanguages = currentModel.availableLanguages.filter(
          (shortCode) => !payload.availableLanguages!.includes(shortCode)
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
      }

      // Build update specification containing ONLY properties present in the request.
      const spec: IUpdateModelInfoSpec = {};
      if (payload.name !== undefined) spec.name = payload.name;
      if (payload.description !== undefined) spec.description = payload.description;
      if (payload.locale !== undefined) spec.locale = payload.locale;
      if (payload.license !== undefined) spec.license = payload.license;
      if (payload.UUIDHistory !== undefined) spec.UUIDHistory = payload.UUIDHistory;
      if (payload.availableLanguages !== undefined) spec.availableLanguages = payload.availableLanguages;
      if (payload.released !== undefined) spec.released = payload.released;
      if (payload.releaseNotes !== undefined) spec.releaseNotes = payload.releaseNotes;

      const patchedModel = await modelRepository.patchModel(modelId, currentModel, spec);
      if (patchedModel === null) {
        // A null result means the conditional filter missed. Re-read the model to tell apart:
        // 1. Model was deleted
        // 2. Model was concurrently released (forbidden metadata update)
        // 3. Concurrent language additions occurred (stale language update attempting removal)
        const reReadModel = await modelRepository.getModelById(modelId);
        if (reReadModel === null) {
          return this.modelNotFound(modelId);
        }
        const hasMetadataOrRelease = hasMetadataChange || payload.released;
        if (hasMetadataOrRelease && reReadModel.released) {
          return this.modelAlreadyReleased(modelId);
        }
        if (payload.availableLanguages !== undefined) {
          const droppedLanguages = reReadModel.availableLanguages.filter(
            (shortCode) => !payload.availableLanguages!.includes(shortCode)
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

          return errorResponse(
            StatusCodes.CONFLICT,
            ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status409.ErrorCodes.MODEL_CONCURRENTLY_MODIFIED,
            "The model was concurrently modified",
            "Available languages changed while processing the request. Fetch the model's current state and retry."
          );
        }
        throw new Error("Failed to patch model due to concurrent modification");
      }

      const updatedModel = patchedModel;
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
