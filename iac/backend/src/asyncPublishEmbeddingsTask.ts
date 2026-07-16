import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {asset, Output} from "@pulumi/pulumi";

// The async-publish-embeddings-task lambda is bundled by esbuild from
// backend/src/embeddings/asyncPublishEmbeddingsTask/index.ts
const buildFolderPath = "../../backend/build/embeddings/asyncPublishEmbeddingsTask";

const LOG_RETENTION_IN_DAYS = 7;

// The publisher streams every entity of a (potentially large) model from the database and pushes it to the
// embeddings queue, so it needs a long timeout — this is exactly the slow work that would otherwise time out
const LAMBDA_TIMEOUT_IN_SECONDS = 300; // 5 minutes

const LAMBDA_MEMORY_IN_MB = 1024;

const LAMBDA_MAXIMUM_CONCURRENT_EXECUTIONS = 2;

interface SetupAsyncPublishEmbeddingsTaskFnConfig {
  mongodb_uri: string,
  resourcesBaseUrl: string,
  embeddings_queue_url: Output<string>,
  embeddings_queue_region: Output<string>,
  embeddings_queue_arn: Output<string>,
  sentry_backend_dsn: string
}

interface SetupAsyncPublishEmbeddingsTaskFnOutput {
  asyncPublishEmbeddingsTaskLambdaRole: aws.iam.Role,
  asyncPublishEmbeddingsTaskLambdaFunction: aws.lambda.Function
}

/**
 * Lambda that publishes the entities of a model to the embeddings queue in the background.
 */
export function setupAsyncPublishEmbeddingsTaskFn(
  environment: string,
  config: SetupAsyncPublishEmbeddingsTaskFnConfig
): SetupAsyncPublishEmbeddingsTaskFnOutput {
  // Create a new IAM role for the Lambda function
  const asyncPublishEmbeddingsTaskLambdaRole = new aws.iam.Role("async-publish-embeddings-task-function-role", {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
        },
      ],
    }),
  });

  // Attach the CloudWatch Logs policy to the IAM role
  const cloudwatchPolicy = aws.iam.getPolicy({
    arn: "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
  });

  const asyncPublishEmbeddingsTaskLambdaPolicy = new aws.iam.Policy("async-publish-embeddings-task-function-policy", {
    policy: cloudwatchPolicy.then((cp) => cp.policy),
  });

  new aws.iam.RolePolicyAttachment("async-publish-embeddings-task-function-role-policy-attachment", {
    policyArn: asyncPublishEmbeddingsTaskLambdaPolicy.arn,
    role: asyncPublishEmbeddingsTaskLambdaRole.name,
  });

  // Send message to the embeddings queue policy.
  // The publisher is the producer that pushes the entities of a model onto the embeddings queue.
  const embeddingsQueueSendMessagePolicy = new aws.iam.Policy(
    "async-publish-embeddings-task-function-embeddings-queue-send-policy",
    {
      policy: config.embeddings_queue_arn.apply((queueArn) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: [
              "sqs:SendMessage",
              "sqs:SendMessageBatch",
              "sqs:GetQueueAttributes",
            ],
            Effect: "Allow",
            Resource: queueArn,
          }
        ]
      }))
    }
  );

  new aws.iam.RolePolicyAttachment("async-publish-embeddings-task-function-role-embeddings-queue-send-policy-attachment", {
    policyArn: embeddingsQueueSendMessagePolicy.arn,
    role: asyncPublishEmbeddingsTaskLambdaRole.name,
  });

  const asyncFileArchive = new asset.FileArchive(buildFolderPath);

  // Create a new AWS Lambda function
  const asyncPublishEmbeddingsTaskLambdaFunction = new aws.lambda.Function("async-publish-embeddings-task-function", {
    role: asyncPublishEmbeddingsTaskLambdaRole.arn,
    code: asyncFileArchive,
    handler: "index.handler",
    runtime: 'nodejs20.x',
    timeout: LAMBDA_TIMEOUT_IN_SECONDS,
    memorySize: LAMBDA_MEMORY_IN_MB,
    reservedConcurrentExecutions: LAMBDA_MAXIMUM_CONCURRENT_EXECUTIONS,
    environment: {
      variables: {
        NODE_OPTIONS: '--enable-source-maps',
        RESOURCES_BASE_URL: config.resourcesBaseUrl,
        MONGODB_URI: config.mongodb_uri,
        EMBEDDINGS_QUEUE_URL: config.embeddings_queue_url,
        EMBEDDINGS_QUEUE_REGION: config.embeddings_queue_region,
        SENTRY_BACKEND_DSN: config.sentry_backend_dsn,
        TARGET_ENVIRONMENT: environment,
      }
    }
  });

  // Create log group with retention of days,
  // log group is assigned to the lambda function via the name of the log group (see https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html)
  new aws.cloudwatch.LogGroup("async-publish-embeddings-task-log-group", {
    name: pulumi.interpolate`/aws/lambda/${asyncPublishEmbeddingsTaskLambdaFunction.name}`,
    retentionInDays: LOG_RETENTION_IN_DAYS
  });

  return {asyncPublishEmbeddingsTaskLambdaRole, asyncPublishEmbeddingsTaskLambdaFunction};
}
