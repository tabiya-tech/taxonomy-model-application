import mongoose from "mongoose";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import AuthAPISpecs from "api-specifications/auth";
import { errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { parsePath } from "common/parsePath/parsePath";
import { RoleRequired, checkRole } from "auth/authorizer";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { transform } from "modelInfo/transform";

/**
 * @openapi
 *
 * /models/{modelId}:
 *   get:
 *     operationId: GETModelById
 *     tags:
 *       - model
 *     summary: Get a taxonomy model by ID.
 *     description: |
 *       Retrieve information about a specific taxonomy model.
 *
 *       Released models are visible to all users. Unreleased models are visible
 *       only to model managers.
 *     security:
 *       - api_key: []
 *       - jwt_auth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         description: The unique identifier of the taxonomy model.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully retrieved the taxonomy model.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelInfoResponseSchemaGET'
 *       '401':
 *         $ref: '#/components/responses/UnAuthorizedResponse'
 *       '404':
 *         description: The model was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GETModel404ErrorSchema'
 *       '500':
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */
export class ModelGETHandler {
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { modelId } = parsePath<{ modelId?: string }>(Routes.MODEL_ROUTE, event.path);
    if (!modelId) return this.modelNotFound("");
    if (!mongoose.Types.ObjectId.isValid(modelId)) return this.modelNotFound(modelId);

    const modelRepository = getRepositoryRegistry().modelInfo;
    try {
      const model = await modelRepository.getModelById(modelId);
      if (model === null) return this.modelNotFound(modelId);

      // same visibility rule as GET /models (list): only model managers see unreleased models
      const isModelManager = await checkRole(event, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);
      if (!isModelManager && !model.released) return this.modelNotFound(modelId);

      const uuidHistoryDetails = await modelRepository.getHistory(model.UUIDHistory);
      return responseJSON(StatusCodes.OK, transform(model, getResourcesBaseUrl(), uuidHistoryDetails));
    } catch (error: unknown) {
      console.error("Failed to retrieve the model from the DB", error);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ModelInfoAPISpecs.ModelInfo.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_MODEL,
        "Failed to retrieve the model from the DB",
        ""
      );
    }
  }
  private modelNotFound(modelId: string): APIGatewayProxyResult {
    return errorResponseGET(
      StatusCodes.NOT_FOUND,
      ModelInfoAPISpecs.ModelInfo.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID,
      "Model not found",
      `No model found with id: ${modelId}`
    );
  }
}
