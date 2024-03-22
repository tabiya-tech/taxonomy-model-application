To protect a Lambda proxy integration REST API with user authentication using Pulumi, you can leverage AWS Cognito for user authentication and Amazon API Gateway for controlling access to your API. Below are the steps to set this up:

1. **Install Pulumi and Configure AWS Credentials**:

   Make sure you have Pulumi installed, and configure your AWS credentials using `aws configure` or by setting environment variables.

2. **Create an AWS Cognito User Pool and User Pool Client**:

   Define your AWS Cognito User Pool and User Pool Client using Pulumi. Here's an example in TypeScript:

   ```typescript
   import * as pulumi from "@pulumi/pulumi";
   import * as aws from "@pulumi/aws";

   const userPool = new aws.cognito.UserPool("myUserPool", {
       // Configure your User Pool settings here.
   });

   const userPoolClient = new aws.cognito.UserPoolClient("myUserPoolClient", {
       userPoolId: userPool.id,
       // Configure your User Pool Client settings here.
   });

   export const userPoolId = userPool.id;
   export const userPoolClientId = userPoolClient.id;
   ```

3. **Define an AWS Lambda Function**:

   Create an AWS Lambda function using Pulumi. This function will serve as the backend for your REST API. You can use the `@pulumi/aws` library to define your Lambda function's code and configuration.

4. **Create an AWS API Gateway REST API**:

   Define an AWS API Gateway REST API that uses the Lambda function as a proxy integration. Here's an example in TypeScript:

   ```typescript
   import * as pulumi from "@pulumi/pulumi";
   import * as aws from "@pulumi/aws";

   const restApi = new aws.apigateway.RestApi("myRestApi", {
       description: "My REST API",
   });

   const resource = new aws.apigateway.Resource("myResource", {
       parentId: restApi.rootResourceId,
       pathPart: "myresource",
       restApi: restApi.id,
   });

   const method = new aws.apigateway.Method("myMethod", {
       authorization: "COGNITO_USER_POOLS", // Enable Cognito user pool authorization
       authorizerId: pulumi.interpolate`${restApi.id}/authorizers/${userPool.id}`, // Use the User Pool ID
       httpMethod: "ANY", // Customize this as needed
       resourceId: resource.id,
       restApi: restApi.id,
   });

   const integration = new aws.apigateway.Integration("myIntegration", {
       httpMethod: method.httpMethod,
       resourceId: resource.id,
       restApi: restApi.id,
       type: "AWS_PROXY",
       uri: pulumi.interpolate`arn:aws:apigateway:${aws.config.region}:lambda:path/2015-03-31/functions/${myLambdaFunction.arn}/invocations`,
   });

   const response = new aws.apigateway.MethodResponse("myMethodResponse", {
       httpMethod: method.httpMethod,
       resourceId: resource.id,
       restApi: restApi.id,
       statusCode: "200", // Customize this as needed
   });

   const integrationResponse = new aws.apigateway.IntegrationResponse("myIntegrationResponse", {
       httpMethod: method.httpMethod,
       resourceId: resource.id,
       restApi: restApi.id,
       statusCode: response.statusCode,
   });

   export const apiGatewayInvokeUrl = pulumi.interpolate`${restApi.id}.execute-api.${aws.config.region}.amazonaws.com/prod`;
   ```

   This code creates a REST API with a resource, a method, and an integration with your Lambda function. It also configures Cognito user pool authorization for the API method.

5. **Deploy Your Pulumi Stack**:

   Deploy your Pulumi stack to provision the AWS resources:

   ```bash
   pulumi up
   ```

6. **Testing**:

   Test your authentication flow by running your application and verifying that you can sign in with AWS Cognito as a user authentication provider and access your protected API using the provided Cognito JWT tokens.

These steps outline how to set up user authentication with AWS Cognito and protect a Lambda proxy integration REST API using Pulumi. You can customize the AWS resources and policies to meet your specific requirements.