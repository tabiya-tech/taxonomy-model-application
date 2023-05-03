import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {asset} from "@pulumi/pulumi";
import {RestApi, Stage} from "@pulumi/aws/apigateway";
import {randomUUID} from "crypto";

const buildFolderPath = "../../backend/build";

export function setupBackendRESTApi(environment: string): { restApi: RestApi, stage: Stage } {
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

  // Attach the necessary policies to the IAM role
  const cloudwatchPolicy = aws.iam.getPolicy({
    arn: "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
  });

  const lambdaPolicy = new aws.iam.Policy("model-api-function-policy", {
    policy: cloudwatchPolicy.then((cp) => cp.policy),
  });

  new aws.iam.RolePolicyAttachment("model-api-function-role-policy-attachment", {
    policyArn: lambdaPolicy.arn,
    role: lambdaRole.name,
  });


  let fileArchive = new asset.FileArchive(buildFolderPath);
  // Create a new AWS Lambda function
  const lambdaFunction = new aws.lambda.Function("model-api-function", {
    role: lambdaRole.arn,
    code: fileArchive,
    handler: "index.handler",
    runtime: 'nodejs16.x',
    environment: {
      variables: {
        NODE_OPTIONS: '--enable-source-maps'
      },
    }
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
  const permission = new aws.lambda.Permission("model-api-permission", {
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
   * setup method ANY
   */
  // Create a new API Gateway method
  const anyApiMethod = new aws.apigateway.Method("model-api-method", {
    authorization: "NONE",
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
  const optionsApiMethod = new aws.apigateway.Method("model-api-method-OPTIONS", {
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
    responseModels: {

    }
  });


  const optionsApiIntegrationResponse = new aws.apigateway.IntegrationResponse("model-api-integration-response-OPTIONS", {
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
  }, {dependsOn:[optionsApiMethodResponse]});


  /**
   * setup stage and deployment
   */
  // Create a new API Gateway deployment
  // @ts-ignore

  const deployment = new aws.apigateway.Deployment("model-api-deployment", {
    restApi: restApi.id,
    triggers: {
      // for now always redeploy
      // TODO: redeploy only if a relevant API gateway resource will change
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
  return {restApi, stage};
}

