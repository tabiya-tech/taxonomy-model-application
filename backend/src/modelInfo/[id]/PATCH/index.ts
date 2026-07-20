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

/**
 * @openapi
 *
 * /models/{modelId}:
 *     patch:
 *       operationId: PATCHModel
 *       tags:
 *         - model
 *       summary: Release a taxonomy model.
 *       description: |
 *         Release a taxonomy model. Once released, the model's ESCO entities become read-only and the model
 *         becomes visible to all users, not just model managers. This endpoint can only be used to release a
 *         model; it cannot be used to un-release one or to edit any other model field.
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
 *           description: Successfully released the model.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ModelInfoResponseSchemaPATCH'
 *         '400':
 *           description: |
 *             Failed to release the model. Additional information can be found in the response body.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorSchema'
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

    try {
      // A null result means the model doesn't exist or is already released; fetch it to tell those apart.
      const updatedModel = await modelRepository.releaseModel(modelId, payload.releaseNotes);
      if (updatedModel === null) {
        const existingModel = await modelRepository.getModelById(modelId);
        if (existingModel === null) {
          return this.modelNotFound(modelId);
        }
        return errorResponse(
          StatusCodes.CONFLICT,
          ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status409.ErrorCodes.MODEL_ALREADY_RELEASED,
          "The model is already released",
          `Model with id ${modelId} is already released and cannot be released again`
        );
      }
      const uuidHistoryDetails = await modelRepository.getHistory(updatedModel.UUIDHistory);

      return responseJSON(StatusCodes.OK, transform(updatedModel, getResourcesBaseUrl(), uuidHistoryDetails));
    } catch (error: unknown) {
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      console.error(new Error("Failed to release the model", { cause: error }));
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RELEASE_MODEL,
        "Failed to release the model in the DB",
        ""
      );
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
}
