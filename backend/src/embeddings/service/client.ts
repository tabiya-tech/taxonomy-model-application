import { IGenerateEmbeddingTask } from "./types";

export interface IEmbeddingClient {
  pushTaskToQueue(task: IGenerateEmbeddingTask): Promise<void>;
}

export class EmbeddingClient implements IEmbeddingClient {
  pushTaskToQueue(task: IGenerateEmbeddingTask): Promise<void> {
    console.debug("EmbeddingClient.pushTaskToQueue", task);
    throw new Error("Method not implemented.");
  }
}
