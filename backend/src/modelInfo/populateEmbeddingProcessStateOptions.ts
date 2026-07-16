import { IEmbeddingProcessStateDoc } from "embeddings/embeddingProcessState/embeddingProcessState.types";
import mongoose from "mongoose";
import { ModelInfoModelPaths } from "./modelInfoModel";

export const populateEmbeddingProcessStateOptions = {
  path: ModelInfoModelPaths.embeddingProcessState,
  transform: (doc: IEmbeddingProcessStateDoc & { _id: mongoose.Types.ObjectId }) => {
    return {
      id: doc._id.toString(),
      status: doc.status,
      embeddingServiceId: doc.embeddingServiceId,
      totalDocuments: doc.totalDocuments,
      errorCounts: doc.errorCounts,
      warningCounts: doc.warningCounts,
      completedDocuments: doc.completedDocuments,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },
};
