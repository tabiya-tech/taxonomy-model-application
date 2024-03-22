import * as aws from "@pulumi/aws";
import {UserPool} from "@pulumi/aws/cognito";

enum roles {
  ANONYMOUS = "anon", AUTHENTIC = "authenticated-user", ADMIN = "admin", MODEL_MANAGER = "model-manager",
}

export function setupCognito(environment: string, allowedOrigins: string[] = []): UserPool {
  const userPool = new aws.cognito.UserPool("tabiya-users", {
    autoVerifiedAttributes: ["email"], usernameAttributes: ["email"], schemas: [{
      name: "email", attributeDataType: "String", required: true, mutable: true,
    }, {
      name: "name", attributeDataType: "String", required: true, mutable: true,
    },], passwordPolicy: {
      minimumLength: 8, requireLowercase: true, requireNumbers: true, requireSymbols: false, requireUppercase: true,
    },
  });
  return userPool;
}

export function setupUserGroups(userPool: UserPool): void {
  // create an iam role for the cognito user pool
  const cognitoAuthRole = new aws.iam.Role("cognitoTestAuthRole", {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "cognito-idp.amazonaws.com",
        },
      }],
    }),
  });
  Object.values(roles).forEach((role) => {
    new aws.cognito.UserGroup(role, {
      userPoolId: userPool.id,
      description: role,
      precedence: 0,
      roleArn: cognitoAuthRole.arn,
    });
  });
}
