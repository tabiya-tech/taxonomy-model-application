import { initOnce as serverInitOnce } from "server/init";
import { initializeSentry } from "initializeSentry";
import * as Sentry from "@sentry/aws-serverless";
import { Lambdas } from "common/lambda.types";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { IPublishEmbeddingsTaskEvent } from "./asyncPublishEmbeddingsTask.types";

initializeSentry(Lambdas.PUBLISH_EMBEDDINGS_TASK);

/**
 * Checks that the event carries the fields the publisher needs.
 * A malformed event will never succeed on retry, so it is treated as a non-retryable error.
 */
function isValidEvent(event: IPublishEmbeddingsTaskEvent): boolean {
  return (
    typeof event?.processId === "string" &&
    event.processId.length > 0 &&
    typeof event?.modelId === "string" &&
    event.modelId.length > 0 &&
    typeof event?.embeddingServiceId === "string" &&
    event.embeddingServiceId.length > 0
  );
}

/**
 * Entry point for the async-publish-embeddings-task lambda function.
 *
 * The POST /models/{modelId}/embedding-processes endpoint creates the embedding process state and then
 * invokes this lambda asynchronously. This lambda streams every entity of the model from the database and
 * pushes it to the embeddings queue, then updates the embedding process state with the total number of
 * documents that were pushed. Doing this in the background keeps the API request fast on large models.
 *
 * Throwing causes AWS to retry the async invocation, so we only throw when a retry might help (e.g. a
 * transient database initialization failure) and never for a malformed event or a publishing failure,
 * which the service already cleans up after.
 */
export const handler = Sentry.wrapHandler(async (event: IPublishEmbeddingsTaskEvent): Promise<void> => {
  console.info("Publish embeddings task started", event);

  // Validate the event. A malformed event will never succeed on retry, so log and return (do not throw).
  if (!isValidEvent(event)) {
    console.error(
      new Error(`Publish embeddings task: the event does not conform to the expected shape: ${JSON.stringify(event)}`)
    );
    return;
  }

  // Initialize the connection to the database (and registries). If it fails, rethrow so the lambda is retried.
  try {
    await serverInitOnce();
  } catch (e: unknown) {
    console.error(new Error("Publish embeddings task: failed to initialize the server", { cause: e }));
    throw e;
  }

  // Publish the entities to the queue. The service cleans up the process state on failure, so there is
  // nothing for a retry to fix; log and return rather than throwing.
  try {
    await getServiceRegistry().embeddingProcess.publishEmbeddingTasks(
      event.processId,
      event.modelId,
      event.embeddingServiceId
    );
  } catch (e: unknown) {
    console.error(new Error("Publish embeddings task: failed to publish the embedding tasks", { cause: e }));
  }
});
