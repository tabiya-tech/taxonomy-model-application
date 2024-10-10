import * as aws from "@pulumi/aws";
import {asset} from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";
import * as process from "process";

const buildFolderPath = "../../backend/build/auth/customAuthenticator";

const LOG_RETENTION_IN_DAYS = 7;

const LAMBDA_TIMEOUT_IN_SECONDS = 300;

const LAMBDA_MEMORY_IN_MB = 128;

const LAMBDA_MAXIMUM_CONCURRENT_EXECUTIONS = 5;

export function setupAuthorizer(environment: string, config: {
  sentry_backend_dsn: string,
}): {
  authorizerLambdaFunction: aws.lambda.Function
} {
  /**
   * setup custom authorizer lambda
   */

    // Create a new IAM role for the Lambda function
  const authorizerLambdaRole = new aws.iam.Role("model-api-authorizer-function-role", {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17", Statement: [{
          Action: "sts:AssumeRole", Effect: "Allow", Principal: {
            Service: "lambda.amazonaws.com",
          },
        },],
      }),
    });

  // Attach the necessary policies to the IAM role created above
  // CloudWatch Logs policy
  const cloudwatchPolicy = aws.iam.getPolicy({
    arn: "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
  });

  const lambdaLogsPolicy = new aws.iam.Policy("model-api-authorizer-function-logs-policy", {
    policy: cloudwatchPolicy.then((cp) => cp.policy),
  });

  new aws.iam.RolePolicyAttachment("model-api-authorizer-function-role-logs-policy-attachment", {
    policyArn: lambdaLogsPolicy.arn, role: authorizerLambdaRole.name,
  });

  // Build the source code archive
  let authorizerFileArchive = new asset.FileArchive(buildFolderPath);

  // Create a new AWS Lambda function
  const authorizerLambdaFunction = new aws.lambda.Function("model-api-authorizer-function", {
    role: authorizerLambdaRole.arn,
    code: authorizerFileArchive,
    handler: "index.handler",
    runtime: 'nodejs20.x',
    timeout: LAMBDA_TIMEOUT_IN_SECONDS,
    memorySize: LAMBDA_MEMORY_IN_MB,
    reservedConcurrentExecutions: LAMBDA_MAXIMUM_CONCURRENT_EXECUTIONS,
    environment: {
      variables: {
        NODE_OPTIONS: '--enable-source-maps',
        USER_POOL_ID: process.env.USER_POOL_ID!,
        USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID!,
        SENTRY_BACKEND_DSN: config.sentry_backend_dsn,
        TARGET_ENVIRONMENT: environment,
      }
    }
  });

  // Create log group with retention of days,
  // log group is assigned to the lambda function via the name of the log group (see https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html)
  const authorizerLogGroup = new aws.cloudwatch.LogGroup("authorizer-lambda-log-group", {
    name: pulumi.interpolate`/aws/lambda/${authorizerLambdaFunction.name}`,
    retentionInDays: LOG_RETENTION_IN_DAYS
  });

  return {authorizerLambdaFunction};
}
