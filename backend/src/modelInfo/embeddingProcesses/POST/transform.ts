import ModelInfoApiSpecs from "api-specifications/modelInfo";
import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";

/**
 * Transforms an EmbeddingProcessState (as returned by the repository) into the API response payload.
 */
export function transformEmbeddingProcessState(
  embeddingProcessState: IEmbeddingProcessState
): ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Types.Response.Payload {
  return {
    id: embeddingProcessState.id,
    modelId: embeddingProcessState.modelId,
    status: embeddingProcessState.status,
    embeddingServiceId: embeddingProcessState.embeddingServiceId,
    totalDocuments: embeddingProcessState.totalDocuments,
    errorCounts: embeddingProcessState.errorCounts,
    warningCounts: embeddingProcessState.warningCounts,
    completedDocuments: embeddingProcessState.completedDocuments,
    createdAt: embeddingProcessState.createdAt.toISOString(),
    updatedAt: embeddingProcessState.updatedAt.toISOString(),
  };
}
