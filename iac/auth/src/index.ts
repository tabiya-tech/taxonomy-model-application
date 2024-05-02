import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import { Output } from "@pulumi/pulumi";

export const environment = pulumi.getStack();

const domainName = process.env.DOMAIN_NAME!;

const subDomain = "auth"

pulumi.log.info(`Using domain name : ${domainName}`);
if(!domainName) throw new Error("environment variable DOMAIN_NAME is required")

const certificateStack = new pulumi.StackReference(`tabiya-tech/taxonomy-model-application-certificate/${environment}`);
const certificate = certificateStack.getOutput("certificate").apply((t) => ({
  arn: t.arn
} as Output<{ arn: string }>))

const hostedZoneStack = new pulumi.StackReference(`tabiya-tech/taxonomy-model-application-setup/${environment}`);
const hostedZone = hostedZoneStack.getOutput("hostedZone").apply((t) => ({
  zoneId: t.zoneId,
} as Output<{ zoneId: string }>))

const css = fs.readFileSync("../../frontend/public/styles/auth.css", "utf-8");
const image = fs.readFileSync("../../frontend/public/logo-horizontal.jpeg", "base64")

enum TabiyaRoles {
  MODEL_MANAGER = "model-managers",
}

// Create a new user pool
const _userPool = new aws.cognito.UserPool("tabiya-users", {
  autoVerifiedAttributes: ["email"],
  usernameAttributes: [],
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
    requireUppercase: true,
    temporaryPasswordValidityDays: 7
  },
  schemas: [
    {
      attributeDataType: "String",
      name: "email",
      required: true,
      mutable: true,  // Set to true if you want to allow users to change their email
      stringAttributeConstraints: {
        minLength: "5",
        maxLength: "2048",
      },
    }
  ]
});

const appUrls =  [`https://${domainName}/`]

if(pulumi.getStack() == "dev") {
  appUrls.push(`http://localhost:3000/`)
  appUrls.push(`http://localhost:6006/`)
}

// Create a new user pool client
const client = new aws.cognito.UserPoolClient("taxonomy-model-app", {
  allowedOauthFlows: ["code", "implicit"],
  allowedOauthFlowsUserPoolClient: true,
  allowedOauthScopes: ["email", "openid", "profile"],
  generateSecret: true,
  userPoolId: _userPool.id,
  logoutUrls: appUrls,
  supportedIdentityProviders: ["COGNITO"],
  callbackUrls: appUrls,
  refreshTokenValidity: 30, // 30 days
  accessTokenValidity: 1, // 1 hour
  idTokenValidity: 1, // 1 hour
  readAttributes: ["email", "preferred_username"],
  defaultRedirectUri: `https://${domainName}/`,
  explicitAuthFlows: ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_PASSWORD_AUTH"] // so that we're able to use the client to authenticate users
});

// Create a new user pool domain
Object.values(TabiyaRoles).forEach((group) => {
  const role = new aws.iam.Role(group, {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Federated: "cognito-identity.amazonaws.com",
          },
          Condition: {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": _userPool.id,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "authenticated",
            },
          },
        },
      ],
    }),
  })

  const _group = new aws.cognito.UserGroup(group, {
    userPoolId: _userPool.id,
    description: group,
    precedence: 0,
    name: group,
    roleArn: role.arn
  }, { dependsOn: [] });
});


const domain = new aws.cognito.UserPoolDomain("tabiya-users-domain", {
  userPoolId: _userPool.id,
  domain: `${subDomain}.${domainName}`,
  certificateArn: certificate.arn,
})

const record = new aws.route53.Record("auth-cname-record", {
  name: subDomain,
  type: "CNAME",
  ttl: 300,
  zoneId: hostedZone.zoneId,
  records: [domain.cloudfrontDistributionArn],
}, { dependsOn: domain });

// Create a new user pool domain
const uiCustomization = new aws.cognito.UserPoolUICustomization("auth-ui-customization", {
  userPoolId: _userPool.id,
  clientId: client.id,
  css,
  imageFile: image
}, { dependsOn: [ domain ]});

export const userPool = {
  id: _userPool.id,
  name: _userPool.name,
  arn: _userPool.arn,
  clientId: client.id,
  clientSecret: pulumi.unsecret(client.clientSecret),
  cloudfrontDistributionArn: domain.cloudfrontDistributionArn,
  cloudfrontDistributionZoneId: domain.cloudfrontDistributionZoneId,
};

export const _dom = domain;

export const clientId = userPool.clientId;
export const clientSecret = userPool.clientSecret;
export const userPoolId = userPool.id;
