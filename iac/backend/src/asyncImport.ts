import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {asset, Output} from "@pulumi/pulumi";

const buildFolderPath = "../../backend/build/import/async";

const LOG_RETENTION_IN_DAYS = 7;

const LAMBDA_TIMEOUT_IN_SECONDS = 300;

const LAMBDA_MEMORY_IN_MB = 1024;

const LAMBDA_MAXIMUM_CONCURRENT_EXECUTIONS = 2;

export function setupAsyncImportApi(environment: string, config: {
  mongodb_uri: string,
  resourcesBaseUrl: string,
  upload_bucket_name: Output<string>,
  upload_bucket_region: Output<string>
}): { asyncImportLambdaRole: aws.iam.Role, asyncImportLambdaFunction: aws.lambda.Function } {
  /**
   * Lambda for api
   */

    // Create a new IAM role for the Lambda function
  const asyncImportLambdaRole = new aws.iam.Role("async-import-function-role", {
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
  const asyncCloudwatchPolicy = aws.iam.getPolicy({
    arn: "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
  });

  const asyncLambdaPolicy = new aws.iam.Policy("async-import-function-policy", {
    policy: asyncCloudwatchPolicy.then((cp) => cp.policy),
  });

  new aws.iam.RolePolicyAttachment("async-import-function-role-policy-attachment", {
    policyArn: asyncLambdaPolicy.arn,
    role: asyncImportLambdaRole.name,
  });


  let asyncFileArchive = new asset.FileArchive(buildFolderPath);
  // Create a new AWS Lambda function
  const asyncImportLambdaFunction = new aws.lambda.Function("async-import-function", {
    role: asyncImportLambdaRole.arn,
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
        UPLOAD_BUCKET_NAME: config.upload_bucket_name,
        UPLOAD_BUCKET_REGION: config.upload_bucket_region
      }
    }
  });

  // Create log group with retention of days,
  // log group is assigned to the lambda function via the name of the log group (see https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html)
  const asyncLogGroup = new aws.cloudwatch.LogGroup("async-import-log-group", {
    name: pulumi.interpolate`/aws/lambda/${asyncImportLambdaFunction.name}`,
    retentionInDays: LOG_RETENTION_IN_DAYS
  });

  return {asyncImportLambdaRole, asyncImportLambdaFunction};
}
