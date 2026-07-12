import { IGenerateEmbeddingTask } from "./types";

export interface IEmbeddingService {
  processTask(task: IGenerateEmbeddingTask): Promise<void>;
}

export class EmbeddingService implements IEmbeddingService {
  constructor() {}

  async processTask(task: IGenerateEmbeddingTask): Promise<void> {
    console.info("Generated embedding", {
      modelId: task.modelId,
      entityType: task.entityType,
      entityId: task.entityId,
    });
  }
}
