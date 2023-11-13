import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {asset, Output} from "@pulumi/pulumi";

const buildFolderPath = "../../backend/build/export/async";

const LOG_RETENTION_IN_DAYS = 7;

const LAMBDA_TIMEOUT_IN_SECONDS = 300;

const LAMBDA_MEMORY_IN_MB = 1024;

const LAMBDA_MAXIMUM_CONCURRENT_EXECUTIONS = 2;

export function setupAsyncExportApi(environment: string, config: {
  mongodb_uri: string,
  resourcesBaseUrl: string,
  export_bucket_name: Output<string>,
  export_bucket_region: Output<string>
}): { asyncExportLambdaRole: aws.iam.Role, asyncExportLambdaFunction: aws.lambda.Function } {

  // Create a new IAM role for the Lambda function
  const asyncExportLambdaRole = new aws.iam.Role("async-export-function-role", {
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

  const asyncLambdaPolicy = new aws.iam.Policy("async-export-function-policy", {
    policy: asyncCloudwatchPolicy.then((cp) => cp.policy),
  });

  new aws.iam.RolePolicyAttachment("async-export-function-role-policy-attachment", {
    policyArn: asyncLambdaPolicy.arn,
    role: asyncExportLambdaRole.name,
  });


  let asyncFileArchive = new asset.FileArchive(buildFolderPath);
  // Create a new AWS Lambda function
  const asyncExportLambdaFunction = new aws.lambda.Function("async-export-function", {
    role: asyncExportLambdaRole.arn,
    code: asyncFileArchive,
    handler: "index.handler",
    runtime: 'nodejs16.x',
    timeout: LAMBDA_TIMEOUT_IN_SECONDS,
    memorySize: LAMBDA_MEMORY_IN_MB,
    reservedConcurrentExecutions: LAMBDA_MAXIMUM_CONCURRENT_EXECUTIONS,
    environment: {
      variables: {
        NODE_OPTIONS: '--enable-source-maps',
        RESOURCES_BASE_URL: config.resourcesBaseUrl,
        MONGODB_URI: config.mongodb_uri,
        EXPORT_BUCKET_NAME: config.export_bucket_name,
        EXPORT_BUCKET_REGION: config.export_bucket_region
      }
    }
  });

  // Create log group with retention of days,
  // log group is assigned to the lambda function via the name of the log group (see https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html)
  // @ts-ignore
  const asyncLogGroup = new aws.cloudwatch.LogGroup("async-export-log-group", {
    name: pulumi.interpolate`/aws/lambda/${asyncExportLambdaFunction.name}`,
    retentionInDays: LOG_RETENTION_IN_DAYS
  });

  return {asyncExportLambdaRole, asyncExportLambdaFunction};
}
