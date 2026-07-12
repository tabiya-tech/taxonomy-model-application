import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {asset} from "@pulumi/pulumi";

// The embedding lambda is bundled by esbuild from backend/src/embeddings/handler/index.ts
const buildFolderPath = "../../backend/build/embeddings/handler";

const LOG_RETENTION_IN_DAYS = 7;

const LAMBDA_TIMEOUT_IN_SECONDS = 300;

const LAMBDA_MEMORY_IN_MB = 1024;

const LAMBDA_MAXIMUM_CONCURRENT_EXECUTIONS = 2;

interface SetupEmbeddingsFnConfig {
  mongodb_uri: string,
  resourcesBaseUrl: string,
  gemini_api_key: string,
  gemini_embedding_model: string,
  sentry_backend_dsn: string
}

interface SetupEmbeddingsFnOutput {
  embeddingsLambdaRole: aws.iam.Role,
  embeddingsLambdaFunction: aws.lambda.Function
}

export function setupEmbeddingsFn(environment: string, config: SetupEmbeddingsFnConfig): SetupEmbeddingsFnOutput {
  /**
   * Lambda for embedding generation (triggered by the embeddings SQS queue)
   */

    // Create a new IAM role for the Lambda function
  const embeddingsLambdaRole = new aws.iam.Role("embeddings-function-role", {
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

  // Attach the necessary policies to the IAM role
  const cloudwatchPolicy = aws.iam.getPolicy({
    arn: "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
  });

  const embeddingsLambdaPolicy = new aws.iam.Policy("embeddings-function-policy", {
    policy: cloudwatchPolicy.then((cp) => cp.policy),
  });

  new aws.iam.RolePolicyAttachment("embeddings-function-role-policy-attachment", {
    policyArn: embeddingsLambdaPolicy.arn,
    role: embeddingsLambdaRole.name,
  });

  const embeddingsFileArchive = new asset.FileArchive(buildFolderPath);

  // Create a new AWS Lambda function
  const embeddingsLambdaFunction = new aws.lambda.Function("embeddings-function", {
    role: embeddingsLambdaRole.arn,
    code: embeddingsFileArchive,
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
        GEMINI_API_KEY: config.gemini_api_key,
        GEMINI_EMBEDDING_MODEL: config.gemini_embedding_model,
        SENTRY_BACKEND_DSN: config.sentry_backend_dsn,
        TARGET_ENVIRONMENT: environment,
      }
    }
  });

  // Create log group with retention of days,
  // log group is assigned to the lambda function via the name of the log group (see https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html)
  new aws.cloudwatch.LogGroup("embeddings-log-group", {
    name: pulumi.interpolate`/aws/lambda/${embeddingsLambdaFunction.name}`,
    retentionInDays: LOG_RETENTION_IN_DAYS
  });

  return {embeddingsLambdaRole, embeddingsLambdaFunction};
}

export const EMBEDDINGS_LAMBDA_TIMEOUT_IN_SECONDS = LAMBDA_TIMEOUT_IN_SECONDS;
