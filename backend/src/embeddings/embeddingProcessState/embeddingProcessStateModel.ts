import mongoose from "mongoose";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import { IEmbeddingProcessStateDoc } from "./embeddingProcessState.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";

export const ModelName = "EmbeddingProcessStateModel";

export const EmbeddingProcessStateModelPaths = {
  modelId: "modelId",
};

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IEmbeddingProcessStateDoc> {
  const schema = new mongoose.Schema<IEmbeddingProcessStateDoc>(
    {
      [EmbeddingProcessStateModelPaths.modelId]: { type: mongoose.Schema.Types.ObjectId, required: true },
      status: {
        type: String,
        required: true,
        enum: Object.values(ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status),
      },
      embeddingServiceId: {
        type: String,
        required: true,
      },
      totalDocuments: {
        type: Number,
        required: true,
        min: 0,
      },
      errorCounts: {
        type: Number,
        required: true,
        min: 0,
      },
      warningCounts: {
        type: Number,
        required: true,
        min: 0,
      },
      completedDocuments: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(),
      toJSON: getGlobalTransformOptions(),
    }
  );

  return dbConnection.model<IEmbeddingProcessStateDoc>(ModelName, schema);
}
