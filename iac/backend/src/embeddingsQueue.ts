import * as aws from "@pulumi/aws";
import {EMBEDDINGS_LAMBDA_TIMEOUT_IN_SECONDS} from "./embeddings";

// How many times a message is retried before it is moved to the dead-letter queue.
const MAX_RECEIVE_COUNT = 5;

// The visibility timeout must be greater than or equal to the consuming lambda's timeout, otherwise a
// message could become visible again (and be reprocessed) while the lambda is still handling it.
const QUEUE_VISIBILITY_TIMEOUT_IN_SECONDS = EMBEDDINGS_LAMBDA_TIMEOUT_IN_SECONDS + 60;

// AWS maximum retention (14 days) for messages that end up in the dead-letter queue.
const DEAD_LETTER_QUEUE_RETENTION_IN_SECONDS = 1209600;

// Number of records delivered to the lambda per invocation. If N messages are available, the event
// source mapping invokes the lambda with up to BATCH_SIZE records at a time.
const BATCH_SIZE = 10;

/**
 * Set up the embeddings SQS queue and its dead-letter queue and connect the queue to the embedding
 * lambda via an event source mapping so that messages pushed onto the queue automatically trigger the
 * lambda to process them.
 */
export function setupEmbeddingsQueue(config: {
  embeddingsLambdaRole: aws.iam.Role,
  embeddingsLambdaFunction: aws.lambda.Function,
}): {
  embeddingsQueue: aws.sqs.Queue,
  embeddingsDeadLetterQueue: aws.sqs.Queue,
} {
  /**
   * Dead-letter queue: receives messages that fail to process MAX_RECEIVE_COUNT times.
   */
  const embeddingsDeadLetterQueue = new aws.sqs.Queue("embeddings-dead-letter-queue", {
    messageRetentionSeconds: DEAD_LETTER_QUEUE_RETENTION_IN_SECONDS,
  });

  /**
   * Main embeddings queue, with a redrive policy pointing at the dead-letter queue.
   */
  const embeddingsQueue = new aws.sqs.Queue("embeddings-queue", {
    visibilityTimeoutSeconds: QUEUE_VISIBILITY_TIMEOUT_IN_SECONDS,
    redrivePolicy: embeddingsDeadLetterQueue.arn.apply((deadLetterTargetArn) =>
      JSON.stringify({
        deadLetterTargetArn,
        maxReceiveCount: MAX_RECEIVE_COUNT,
      })
    ),
  });

  /**
   * Allow the embedding lambda to consume from the queue.
   */
  const consumePolicy = new aws.iam.Policy("embeddings-queue-consume-policy", {
    policy: embeddingsQueue.arn.apply((queueArn) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "sqs:ReceiveMessage",
              "sqs:DeleteMessage",
              "sqs:GetQueueAttributes",
            ],
            Resource: queueArn,
          },
        ],
      })
    ),
  });

  new aws.iam.RolePolicyAttachment("embeddings-queue-consume-policy-attachment", {
    policyArn: consumePolicy.arn,
    role: config.embeddingsLambdaRole.name,
  });

  /**
   * Event source mapping: SQS queue -> embeddings lambda.
   *
   * When N messages are available on the queue, the lambda is automatically invoked with up to
   * BATCH_SIZE records per invocation until the queue is drained.
   */
  new aws.lambda.EventSourceMapping("embeddings-queue-event-source-mapping", {
    eventSourceArn: embeddingsQueue.arn,
    functionName: config.embeddingsLambdaFunction.arn,
    batchSize: BATCH_SIZE,
    enabled: true,
  });

  return {embeddingsQueue, embeddingsDeadLetterQueue};
}
