import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ValidateFunction } from "ajv";
import ModelInfoApiSpecs from "api-specifications/modelInfo";
import ErrorAPISpecs from "api-specifications/error";
import AuthAPISpecs from "api-specifications/auth";
import { errorResponse, responseJSON, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { ajvInstance, ParseValidationError } from "validator";
import { RoleRequired } from "auth/authorizer";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { parsePath } from "common/parsePath/parsePath";
import { Routes } from "routes.constant";
import {
  EmbeddingProcessAlreadyRunningError,
  ModelNotFoundError,
  ModelNotReleasedError,
} from "embeddings/embeddingProcess/errors";
import { transformEmbeddingProcessState } from "./transform";

/**
 * @openapi
 *
 * /models/{modelId}/embedding-processes:
 *     post:
 *       operationId: PostModelEmbeddingProcess
 *       tags:
 *         - embeddings
 *         - model
 *       summary: Trigger the generation of the embeddings of a model.
 *       description: |
 *         Asynchronously trigger the generation of the embeddings for all the entities of a released model.
 *         The entities are pushed to the embeddings queue and processed in the background.
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
 *               $ref: '#/components/schemas/EmbeddingsRequestSchemaPOST'
 *         required: true
 *       responses:
 *         '202':
 *           description: The embedding process was successfully triggered.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/EmbeddingsResponseSchemaPOST'
 *         '400':
 *           description: |
 *             Failed to trigger the embedding process because the model is not released. Additional information can be found in the response body.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/POSTEmbeddingProcess400ErrorSchema'
 *         '401':
 *           $ref: '#/components/responses/UnAuthorizedResponse'
 *         '403':
 *           $ref: '#/components/responses/ForbiddenResponse'
 *         '404':
 *           description: The model was not found.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/POSTEmbeddingProcess404ErrorSchema'
 *         '409':
 *           description: An embedding process is already running for the model.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/POSTEmbeddingProcess409ErrorSchema'
 *         '415':
 *           $ref: '#/components/responses/AcceptOnlyJSONResponse'
 *         '500':
 *           $ref: '#/components/responses/InternalServerErrorResponse'
 */
export class POSTModelEmbeddingProcessesHandler {
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER) // Applying role-based access control
  async handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    if (!event.headers["Content-Type"]?.includes("application/json")) {
      return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
    }

    if (
      event.body?.length &&
      event.body.length > ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Constants.MAX_PAYLOAD_LENGTH
    ) {
      return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
        `Expected maximum length is ${ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Constants.MAX_PAYLOAD_LENGTH}`
      );
    }

    const { modelId } = parsePath<{ modelId?: string }>(Routes.MODEL_EMBEDDING_PROCESSES_ROUTE, event.path);
    if (!modelId) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
        "modelId is missing in the path",
        JSON.stringify({ path: event.path })
      );
    }

    let payload: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Types.Request.Payload;
    try {
      payload = JSON.parse(event.body as string);
    } catch (error: unknown) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY,
        "Payload is malformed, it should be a valid json",
        (error as Error).message
      );
    }

    const validateFunction = ajvInstance.getSchema(
      ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Schemas.Request.Payload.$id as string
    ) as ValidateFunction;
    const isValid = validateFunction(payload);
    if (!isValid) {
      const errorDetail = ParseValidationError(validateFunction.errors);
      return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
    }

    try {
      const embeddingProcessState = await getServiceRegistry().embeddingProcess.triggerEmbeddingProcess(
        modelId,
        payload.embeddingServiceId
      );
      return responseJSON(StatusCodes.ACCEPTED, transformEmbeddingProcessState(embeddingProcessState));
    } catch (error: unknown) {
      if (error instanceof ModelNotFoundError) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          ErrorAPISpecs.Constants.ErrorCodes.NOT_FOUND,
          "Model not found",
          `No model found with id: ${modelId}`
        );
      }
      if (error instanceof ModelNotReleasedError) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Enums.Response.Status400.ErrorCodes
            .MODEL_NOT_RELEASED,
          "The model is not released",
          "Embeddings can only be generated for released models"
        );
      }
      if (error instanceof EmbeddingProcessAlreadyRunningError) {
        return errorResponse(
          StatusCodes.CONFLICT,
          ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Enums.Response.Status409.ErrorCodes
            .EMBEDDING_PROCESS_ALREADY_RUNNING,
          "An embedding process is already running for this model",
          "Please wait for the current embedding process to complete before triggering a new one"
        );
      }
      console.error(new Error("Failed to trigger the embedding process", { cause: error }));
      // Do not surface the error message to the user as it can contain sensitive information.
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Enums.Response.Status500.ErrorCodes
          .FAILED_TO_TRIGGER_EMBEDDING_PROCESS,
        "Failed to trigger the embedding process",
        ""
      );
    }
  }
}
