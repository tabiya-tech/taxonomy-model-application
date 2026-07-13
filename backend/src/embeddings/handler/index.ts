import { SQSEvent, SQSRecord } from "aws-lambda";
import { initOnce as serverInitOnce } from "server/init";
import { initializeSentry } from "initializeSentry";
import * as Sentry from "@sentry/aws-serverless";
import { Lambdas } from "common/lambda.types";
import { IGenerateEmbeddingTask } from "embeddings/service/types";
import { EmbeddingService } from "embeddings/service/service";
import { validateEmbeddingQueueJob } from "embeddings/specs/queueJob.schema";

initializeSentry(Lambdas.EMBEDDING);

async function initOnce() {
  await serverInitOnce();
  return new EmbeddingService();
}

/**
 * Entry point for the embeddings lambda function.
 *
 * This lambda is triggered by the embeddings SQS queue via an event source mapping: when N messages
 * are available on the queue, the lambda is invoked with up to N records in `event.Records`, and this
 * handler generates the embeddings for each of them in the background.
 *
 * If a record throws, we rethrow so that AWS retries the message and, after the configured number of
 * attempts, moves it to the dead-letter queue.
 */
export const handler = Sentry.wrapHandler(async (event: SQSEvent): Promise<void> => {
  const records = event.Records ?? [];
  console.info(`Embeddings lambda triggered with ${records.length} record(s)`);

  // Initialize the connection to the database (and registries). If it fails, rethrow so the lambda is retried.
  const embeddingService = await initOnce();

  for (const record of records) {
    await handleRecord(embeddingService, record);
  }
});

async function handleRecord(embeddingService: EmbeddingService, record: SQSRecord): Promise<void> {
  let task: IGenerateEmbeddingTask;
  try {
    task = JSON.parse(record.body) as IGenerateEmbeddingTask;
  } catch (e: unknown) {
    // A malformed message will never succeed on retry, so log and skip it rather than throwing.
    console.error(new Error(`Embeddings lambda: skipping unparseable SQS record ${record.messageId}`, { cause: e }));
    return;
  }

  // Validate the task against the queue job schema. An invalid job will never succeed on retry,
  // so log and skip it rather than throwing.
  if (!validateEmbeddingQueueJob(task)) {
    console.error(
      new Error(
        `Embeddings lambda: skipping SQS record ${
          record.messageId
        } that does not conform to the queue job schema: ${JSON.stringify(validateEmbeddingQueueJob.errors)}`
      )
    );
    return;
  }

  console.info("Processing embedding task", { messageId: record.messageId, task });
  await embeddingService.processTask(task);
}
