import mongoose from "mongoose";
import ModelInfoApiSpecs from "api-specifications/modelInfo";

/**
 * Describes how an embedding process state is saved in the database.
 */
export interface IEmbeddingProcessStateDoc {
  modelId: mongoose.Types.ObjectId;
  status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status;
  embeddingServiceId: string;
  totalDocuments: number;
  errorCounts: number;
  warningCounts: number;
  completedDocuments: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how an embedding process state is returned from the API.
 */
export interface IEmbeddingProcessState extends Omit<IEmbeddingProcessStateDoc, "modelId"> {
  id: string;
  modelId: string;
}

/**
 * Describes how a new embedding process state is created.
 */
export type INewEmbeddingProcessStateSpec = Omit<IEmbeddingProcessState, "id" | "createdAt" | "updatedAt">;

/**
 * Describes how an embedding process state is updated.
 */
export type IUpdateEmbeddingProcessStateSpec = Partial<Omit<IEmbeddingProcessStateDoc, "modelId">>;

/**
 * Describes how the progress counters of an embedding process state are incremented.
 */
export type IIncrementEmbeddingProcessStateCountsSpec = Partial<
  Pick<IEmbeddingProcessStateDoc, "completedDocuments" | "errorCounts" | "warningCounts">
>;
