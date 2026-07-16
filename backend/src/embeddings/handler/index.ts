import { SQSEvent, SQSRecord } from "aws-lambda";
import { initOnce as serverInitOnce } from "server/init";
import { initializeSentry } from "initializeSentry";
import * as Sentry from "@sentry/aws-serverless";
import { Lambdas } from "common/lambda.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IGenerateEmbeddingTask } from "embeddings/service/types";
import { EmbeddingService } from "embeddings/service/service";
import { getEmbeddingModelService } from "embeddings/models/embeddingModelServiceFactory";
import { validateEmbeddingQueueJob } from "embeddings/specs/queueJob.schema";

initializeSentry(Lambdas.EMBEDDING);

async function initOnce() {
  await serverInitOnce();
  const repositoryRegistry = getRepositoryRegistry();
  return new EmbeddingService({
    skillRepository: repositoryRegistry.skill,
    skillGroupRepository: repositoryRegistry.skillGroup,
    occupationRepository: repositoryRegistry.occupation,
    occupationGroupRepository: repositoryRegistry.OccupationGroup,
    skillEmbeddingRepository: repositoryRegistry.skillEmbedding,
    skillGroupEmbeddingRepository: repositoryRegistry.skillGroupEmbedding,
    occupationEmbeddingRepository: repositoryRegistry.occupationEmbedding,
    occupationGroupEmbeddingRepository: repositoryRegistry.occupationGroupEmbedding,
    embeddingProcessStateRepository: repositoryRegistry.embeddingProcessState,
    embeddingModelServiceFactory: getEmbeddingModelService,
  });
}

/**
 * A parsed SQS record: the task it carries, together with the message it came from for traceability.
 */
interface IParsedRecord {
  messageId: string;
  task: IGenerateEmbeddingTask;
}

/**
 * Entry point for the embedding lambda function.
 *
 * This lambda is triggered by the embedding SQS queue via an event source mapping: when N messages
 * are available on the queue, the lambda is invoked with up to N records in `event.Records`, and this
 * handler generates the embeddings for all of them as a single batch.
 *
 * If the batch throws, we rethrow so that AWS retries the messages and, after the configured number of
 * attempts, moves them to the dead-letter queue.
 */
export const handler = Sentry.wrapHandler(async (event: SQSEvent): Promise<void> => {
  const records = event.Records ?? [];
  console.info(`Embeddings lambda triggered with ${records.length} record(s)`);

  // Initialize the connection to the database (and registries). If it fails, rethrow so the lambda is retried.
  const embeddingService = await initOnce();

  // 1. Parse all the records first, dropping the unparseable ones.
  const parsedRecords = parseRecords(records);

  // 2. Validate all the parsed tasks against the queue job schema together, dropping the invalid ones.
  const validRecords = filterValidRecords(parsedRecords);
  if (validRecords.length === 0) {
    return;
  }

  // 3. Process all the valid tasks together as a single batch, so that the embeddings of the whole event
  //    are generated in batched embedding model calls (e.g., Gemini's batchEmbedContents).
  console.info(`Processing ${validRecords.length} embedding task(s)`, {
    messageIds: validRecords.map((validRecord) => validRecord.messageId),
  });
  await embeddingService.processTasks(validRecords.map((validRecord) => validRecord.task));
});

/**
 * Parses the bodies of the given SQS records into embedding tasks.
 * A malformed message will never succeed on retry, so it is logged and dropped rather than thrown on.
 */
function parseRecords(records: SQSRecord[]): IParsedRecord[] {
  const parsedRecords: IParsedRecord[] = [];
  for (const record of records) {
    try {
      parsedRecords.push({ messageId: record.messageId, task: JSON.parse(record.body) as IGenerateEmbeddingTask });
    } catch (e: unknown) {
      console.error(new Error(`Embeddings lambda: skipping unparseable SQS record ${record.messageId}`, { cause: e }));
    }
  }
  return parsedRecords;
}

/**
 * Keeps only the records whose task conforms to the embedding queue job schema.
 * An invalid job will never succeed on retry, so it is logged and dropped rather than thrown on.
 */
function filterValidRecords(parsedRecords: IParsedRecord[]): IParsedRecord[] {
  return parsedRecords.filter((parsedRecord) => {
    if (validateEmbeddingQueueJob(parsedRecord.task)) {
      return true;
    }
    console.error(
      new Error(
        `Embeddings lambda: skipping SQS record ${
          parsedRecord.messageId
        } that does not conform to the queue job schema: ${JSON.stringify(validateEmbeddingQueueJob.errors)}`
      )
    );
    return false;
  });
}
