import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { IGenerateEmbeddingTask } from "./types";
import { getEmbeddingsQueueUrl } from "server/config/config";
import { validateEmbeddingQueueJob } from "embeddings/specs/queueJob.schema";

export interface IEmbeddingClient {
  pushTaskToQueue(task: IGenerateEmbeddingTask): Promise<void>;
}

export class EmbeddingClient implements IEmbeddingClient {
  constructor(private sqsClient: SQSClient) {}

  async pushTaskToQueue(task: IGenerateEmbeddingTask): Promise<void> {
    // Validate the task against the queue job schema before pushing it,
    // so that a malformed job never ends up on the queue.
    const isValid = validateEmbeddingQueueJob(task);
    if (!isValid) {
      const err = new Error(
        `EmbeddingClient.pushTaskToQueue: the task does not conform to the queue job schema: ${JSON.stringify(
          validateEmbeddingQueueJob.errors
        )}`
      );
      console.error(err);
      throw err;
    }

    try {
      await this.sqsClient.send(
        new SendMessageCommand({
          QueueUrl: getEmbeddingsQueueUrl(),
          MessageBody: JSON.stringify(task),
        })
      );
    } catch (e: unknown) {
      const err = new Error("EmbeddingClient.pushTaskToQueue: failed to push task to queue", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
