import { SQSClient, SendMessageCommand, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { IGenerateEmbeddingTask } from "./types";
import { getEmbeddingsQueueUrl } from "server/config/config";
import { validateEmbeddingQueueJob } from "embeddings/specs/queueJob.schema";

// SQS SendMessageBatch accepts at most 10 messages per request (AWS hard limit).
// reference: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/sqs/command/SendMessageBatchCommand/
export const SQS_MAX_BATCH_SIZE = 10;

export interface IEmbeddingClient {
  pushTaskToQueue(task: IGenerateEmbeddingTask): Promise<void>;
  pushTasksToQueue(tasks: IGenerateEmbeddingTask[]): Promise<void>;
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

  async pushTasksToQueue(tasks: IGenerateEmbeddingTask[]): Promise<void> {
    // Validate all the tasks against the queue job schema before pushing any of them,
    // so that a malformed job never ends up on the queue.
    for (const task of tasks) {
      const isValid = validateEmbeddingQueueJob(task);
      if (!isValid) {
        const err = new Error(
          `EmbeddingClient.pushTasksToQueue: a task does not conform to the queue job schema: ${JSON.stringify(
            validateEmbeddingQueueJob.errors
          )}`
        );
        console.error(err);
        throw err;
      }
    }

    try {
      for (let i = 0; i < tasks.length; i += SQS_MAX_BATCH_SIZE) {
        const batch = tasks.slice(i, i + SQS_MAX_BATCH_SIZE);
        const response = await this.sqsClient.send(
          new SendMessageBatchCommand({
            QueueUrl: getEmbeddingsQueueUrl(),
            Entries: batch.map((task, index) => ({
              // The ID only needs to be unique within a single batch request,
              // it is used to correlate the Successful/Failed entries of the response.
              Id: `${i + index}`,
              MessageBody: JSON.stringify(task),
            })),
          })
        );
        // SendMessageBatch can partially fail without the send() call throwing.
        if (response.Failed && response.Failed.length > 0) {
          throw new Error(`some messages failed to be sent: ${JSON.stringify(response.Failed)}`);
        }
      }
    } catch (e: unknown) {
      const err = new Error("EmbeddingClient.pushTasksToQueue: failed to push tasks to queue", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
