import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {asset, Output} from "@pulumi/pulumi";
import {RestApi, Stage} from "@pulumi/aws/apigateway";
import {randomUUID} from "crypto";
import {UserPool} from "@pulumi/aws/cognito";

const buildFolderPath = "../../backend/build/rest";

const LOG_RETENTION_IN_DAYS = 7;

const LAMBDA_TIMEOUT_IN_SECONDS = 30;

const LAMBDA_MEMORY_IN_MB = 512;

const LAMBDA_MAXIMUM_CONCURRENT_EXECUTIONS = 10;

export function setupBackendRESTApi(environment: string, config: {
  mongodb_uri: string,
  resourcesBaseUrl: string,
  upload_bucket_name: Output<string>,
  upload_bucket_region: Output<string>,
  download_bucket_name: Output<string>,
  download_bucket_region: Output<string>,
  async_import_lambda_function_arn: Output<string>,
  async_export_lambda_function_arn: Output<string>,
  async_lambda_function_region: Output<string>,
}, userPool: UserPool): { restApi: RestApi, stage: Stage, restApiLambdaRole: aws.iam.Role} {
  /**
   * Lambda for api
   */

    // Create a new IAM role for the Lambda function
  const lambdaRole = new aws.iam.Role("model-api-function-role", {
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

  // Attach the necessary policies to the IAM role created above

  // CloudWatch Logs policy
  const cloudwatchPolicy = aws.iam.getPolicy({
    arn: "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
  });

  const lambdaLogsPolicy = new aws.iam.Policy("model-api-function-logs-policy", {
    policy: cloudwatchPolicy.then((cp) => cp.policy),
  });

  new aws.iam.RolePolicyAttachment("model-api-function-role-logs-policy-attachment", {
    policyArn: lambdaLogsPolicy.arn,
    role: lambdaRole.name,
  });

  // Invoke async import lambda function policy
  const asyncImportLambdaInvokePolicy = new aws.iam.Policy("model-api-function-async-import-lambda-invoke-policy", {
    policy: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "lambda:InvokeFunction",
          Effect: "Allow",
          Resource: config.async_import_lambda_function_arn,
        }
      ]
    }
  });

  // Invoke async import lambda function policy
  const asyncExportLambdaInvokePolicy = new aws.iam.Policy("model-api-function-async-export-lambda-invoke-policy", {
    policy: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "lambda:InvokeFunction",
          Effect: "Allow",
          Resource: config.async_export_lambda_function_arn,
        }
      ]
    }
  });



  new aws.iam.RolePolicyAttachment("model-api-function-role-import-lambda-invoke-policy-attachment", {
    policyArn: asyncImportLambdaInvokePolicy.arn,
    role: lambdaRole.name,
  });

  new aws.iam.RolePolicyAttachment("model-api-function-role-export-lambda-invoke-policy-attachment", {
    policyArn: asyncExportLambdaInvokePolicy.arn,
    role: lambdaRole.name,
  });

  // Build the source code archive
  let fileArchive = new asset.FileArchive(buildFolderPath);

  // Create a new AWS Lambda function
  const lambdaFunction = new aws.lambda.Function("model-api-function", {
    role: lambdaRole.arn,
    code: fileArchive,
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
        UPLOAD_BUCKET_REGION: config.upload_bucket_region,
        DOWNLOAD_BUCKET_NAME: config.download_bucket_name,
        DOWNLOAD_BUCKET_REGION: config.download_bucket_region,
        ASYNC_IMPORT_LAMBDA_FUNCTION_ARN: config.async_import_lambda_function_arn,
        ASYNC_EXPORT_LAMBDA_FUNCTION_ARN: config.async_export_lambda_function_arn,
        ASYNC_LAMBDA_FUNCTION_REGION: config.async_lambda_function_region,
      }
    }
  });

  // Create log group with retention of days,
  // log group is assigned to the lambda function via the name of the log group (see https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html)
  const logGroup = new aws.cloudwatch.LogGroup("model-api-log-group", {
    name: pulumi.interpolate `/aws/lambda/${lambdaFunction.name}`,
    retentionInDays:  LOG_RETENTION_IN_DAYS
  });

  /**
   *
   * API Gateway
   */
    // Create a new API Gateway REST API
  const restApi = new aws.apigateway.RestApi("model-api", {
      name: "model-api",
      description: "The taxonomy model api"
    });

  // Add the necessary permissions to allow the API Gateway to invoke the Lambda function
  new aws.lambda.Permission("model-api-permission", {
    action: "lambda:InvokeFunction",
    function: lambdaFunction.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${restApi.executionArn}/*/*/*`,
  });

  // Create a new API Gateway resource
  const apiResource = new aws.apigateway.Resource("model-api-resource", {
    parentId: restApi.rootResourceId,
    pathPart: "{proxy+}",
    restApi: restApi.id,
  });

  /**
   * setup cognito authorizer
   */
  const authorizer = new aws.apigateway.Authorizer("model-api-authorizer", {
    restApi: restApi.id,
    name: "model-api-authorizer",
    type: "COGNITO_USER_POOLS",
    identitySource: "method.request.header.Authorization",
    providerArns: [userPool.arn],
    identityValidationExpression: '^Bearer.*',
    // Allow unauthenticated requests
    authorizerResultTtlInSeconds: 0,

  });

  /**
   * setup method ANY
   */
    // Create a new API Gateway method
  const anyApiMethod = new aws.apigateway.Method("model-api-method", {
      authorization: "COGNITO_USER_POOLS",
      // authorizerId: authorizer.id,
      httpMethod: "ANY",
      resourceId: apiResource.id,
      restApi: restApi.id,
    }, {dependsOn: [apiResource, restApi]});

  // Create a new Lambda proxy integration
  const lambdaAnyIntegration = new aws.apigateway.Integration("model-api-integration", {
    integrationHttpMethod: "POST", // For Lambda integration we need to use POST
    httpMethod: "ANY",
    resourceId: apiResource.id,
    restApi: restApi.id,
    type: "AWS_PROXY",
    uri: lambdaFunction.invokeArn,
  }, {dependsOn: [apiResource, restApi, lambdaFunction]});

  /**
   * setup method OPTIONS
   */
  // Create a new API Gateway method
  new aws.apigateway.Method("model-api-method-OPTIONS", {
    authorization: "NONE",
    httpMethod: "OPTIONS",
    resourceId: apiResource.id,
    restApi: restApi.id,
  }, {dependsOn: [apiResource, restApi]});

  // Create a new Lambda proxy integration
  const mockOptionsIntegration = new aws.apigateway.Integration("model-api-integration-OPTIONS", {
    httpMethod: "OPTIONS",
    resourceId: apiResource.id,
    restApi: restApi.id,
    type: "MOCK",
    passthroughBehavior: "WHEN_NO_MATCH",
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    }
  }, {dependsOn: [apiResource, restApi, lambdaFunction]});


  const optionsApiMethodResponse = new aws.apigateway.MethodResponse("model-api-method-response-OPTIONS", {
    restApi: restApi.id,
    resourceId: apiResource.id,
    httpMethod: mockOptionsIntegration.httpMethod,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Origin": true,
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Methods": true
    },
    responseModels: {}
  });


  new aws.apigateway.IntegrationResponse("model-api-integration-response-OPTIONS", {
    restApi: restApi.id,
    resourceId: apiResource.id,
    httpMethod: mockOptionsIntegration.httpMethod,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Origin": "'*'",
      "method.response.header.Access-Control-Allow-Headers": "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
      "method.response.header.Access-Control-Allow-Methods": "'OPTIONS, GET, POST, PUT, DELETE, PATCH, HEAD'"
    },
    responseTemplates: {
      "application/json": ""
    }
  }, {dependsOn: [optionsApiMethodResponse]});


  /**
   * setup stage and deployment
   */
    // Create a new API Gateway deployment
    // @ts-ignore

  const deployment = new aws.apigateway.Deployment("model-api-deployment", {
      restApi: restApi.id,
      triggers: {
        // Currently always redeploy, in the future, redeploy only if a relevant API gateway resource has changed
        redeployment: randomUUID(),
      }
      // You can set the stage name and description as desired
    }, {dependsOn: [restApi, lambdaAnyIntegration, anyApiMethod]});

  // Create a new API Gateway stage
  const stage = new aws.apigateway.Stage("model-api-stage", {
    deployment: deployment.id,
    restApi: restApi.id,
    description: "Development environment",
    stageName: environment // dev, test, prod this is typically the stack name
  }, {dependsOn: [restApi, deployment]});

  // @ts-ignore
  return {restApi, stage, restApiLambdaRole: lambdaRole};
}

export function getRestApiDomainName(stage: Stage) {
  return pulumi.interpolate`${stage.restApi}.execute-api.${aws.getRegionOutput().name}.amazonaws.com`;
}

export function getRestApiPath(stage: Stage) {
  return pulumi.interpolate`/${stage.stageName}`;
}
