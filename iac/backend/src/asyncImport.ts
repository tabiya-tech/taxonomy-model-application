import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {asset, Output} from "@pulumi/pulumi";

const buildFolderPath = "../../backend/build/import/async";

const LOG_RETENTION_IN_DAYS = 7;

export function setupAsyncImportApi(environment: string, config: {
  mongodb_uri: string,
  resourcesBaseUrl: string,
  upload_bucket_name: Output<string>,
  upload_bucket_region: Output<string>
}): { asyncLambdaRole: aws.iam.Role, asyncLambdaFunction: aws.lambda.Function } {
  /**
   * Lambda for api
   */

    // Create a new IAM role for the Lambda function
  const asyncLambdaRole = new aws.iam.Role("async-import-function-role", {
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
    role: asyncLambdaRole.name,
  });


  let asyncFileArchive = new asset.FileArchive(buildFolderPath);
  // Create a new AWS Lambda function
  const asyncLambdaFunction = new aws.lambda.Function("async-import-function", {
    role: asyncLambdaRole.arn,
    code: asyncFileArchive,
    handler: "index.handler",
    runtime: 'nodejs16.x',
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
    name: pulumi.interpolate`/aws/lambda/${asyncLambdaFunction.name}`,
    retentionInDays: LOG_RETENTION_IN_DAYS
  });

  // @ts-ignore
  return {asyncLambdaRole, asyncLambdaFunction};
}
