import * as aws from "@pulumi/aws";
import {Function} from "@pulumi/aws/cloudfront";
import * as fs from "fs";
import * as path from "path";
import {interpolate, Output} from "@pulumi/pulumi";


enum Cache_ManagedPolicies {
  //Policy with caching disabled
  CachingDisabled = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",

  // Policy with caching enabled. Supports Gzip and Brotli compression
  CachingOptimized = "658327ea-f89d-4fab-a63d-7e88639e58f6",

  // Policy with caching enabled. Compression is disabled
  CachingOptimizedForUncompressedObjects = "b2884449-e4de-46a7-ac36-70bc7f1ddd6d"
}

enum ResponseHeader_ManagedPolicies {
  // Allows all origins for simple CORS requests
  SimpleCors = "60669652-455b-4ae9-85a4-c4c02393f86c",

  // Adds a set of security headers to every response
  SecurityHeadersPolicy = "67f7725c-6f97-4210-82d7-5512b31e9d03",

  // Allows all origins for CORS requests, including preflight requests
  CORSWithPreflight = "5cc3b908-e619-4b99-88e5-2cf7f45965bd"
}

enum OriginRequest_ManagedPolicies {
  //Policy for S3 origin with CORS
  CORSS3Origin = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",

  // Policy to forward all parameters in viewer requests
  AllViewer = "216adef6-5c7f-47e4-b989-5492eafa07d3",

  //

  // Policy to forward all parameters in viewer requests except for the Host header
  AllViewerExceptHostHeader = "b689b0a8-53d0-40ab-baf2-68738e2966ac",
}

type Origins = {
  frontendBucketOrigin: {
    arn: Output<string>,
    websiteEndpoint: Output<string>
  },
  backendRestApiOrigin: {
    restApiArn: Output<string>,
    domainName: Output<string>,
    path: Output<string>
  },
  swaggerBucketOrigin: {
    arn: Output<string>,
    websiteEndpoint: Output<string>
  },
  redocBucketOrigin: {
    arn: Output<string>,
    websiteEndpoint: Output<string>
  },
  localesBucketOrigin: {
    arn: Output<string>,
    websiteEndpoint: Output<string>
  },
}

function getFrontendNoCachingBehaviour(bucketArn: Output<string>, pathPattern: string[], urlRewriteFunction: Function) {
  return pathPattern.map(pathPattern => {
    return {
      compress: true,
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      targetOriginId: bucketArn,
      pathPattern: pathPattern,
      responseHeadersPolicyId: ResponseHeader_ManagedPolicies.SecurityHeadersPolicy,
      cachePolicyId: Cache_ManagedPolicies.CachingDisabled,
      originRequestPolicyId: OriginRequest_ManagedPolicies.CORSS3Origin,
      functionAssociations: [
        {
          eventType: "viewer-request",
          functionArn: urlRewriteFunction.arn,
        }
      ],
      viewerProtocolPolicy: "redirect-to-https",
    }
  });
}

export function setupCDN(
  origns: Origins,
  certificateArn: Output<string>,
  hostedZoneId: Output<string>,
  domainName: string
): {
  backendURLBase: Output<string>,
  frontendURLBase: Output<string>,
  swaggerURLBase: Output<string>,
  redocURLBase: Output<string>,
  localesURLBase: Output<string>,
} {
  const { frontendBucketOrigin, backendRestApiOrigin, swaggerBucketOrigin, redocBucketOrigin, localesBucketOrigin } = origns;

  const urlRewriteFunction = new aws.cloudfront.Function("urlRewrite", {
    runtime: "cloudfront-js-1.0",
    comment: "rewrite urls to remove the path before routing to the origin",
    publish: true,
    code: fs.readFileSync(`${path.dirname(__filename)}/urlRewrite.js`, 'utf-8'),
  });

  // Create a CloudFront CDN to distribute and cache the website.
  const cdn = new aws.cloudfront.Distribution("cdn", {
    enabled: true,
    origins: [
      {
        originId: frontendBucketOrigin.arn,
        domainName: frontendBucketOrigin.websiteEndpoint,
        customOriginConfig: {
          originProtocolPolicy: "http-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
      },
      {
        originId: backendRestApiOrigin.restApiArn,
        domainName: backendRestApiOrigin.domainName,
        originPath: backendRestApiOrigin.path,
        customOriginConfig: {
          originProtocolPolicy: "https-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
      },
      {
        originId: swaggerBucketOrigin.arn,
        domainName: swaggerBucketOrigin.websiteEndpoint,
        customOriginConfig: {
          originProtocolPolicy: "http-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
      },
      {
        originId: redocBucketOrigin.arn,
        domainName: redocBucketOrigin.websiteEndpoint,
        customOriginConfig: {
          originProtocolPolicy: "http-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
      },
      {
        originId: localesBucketOrigin.arn,
        domainName: localesBucketOrigin.websiteEndpoint,
        customOriginConfig: {
          originProtocolPolicy: "http-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
      }
    ],
    defaultCacheBehavior: {
      targetOriginId: frontendBucketOrigin.arn,
      compress: true,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: [
        "GET",
        "HEAD",
        "OPTIONS",
      ],
      cachedMethods: [
        "GET",
        "HEAD",
        "OPTIONS",
      ],
      defaultTtl: 600,
      maxTtl: 600,
      minTtl: 600,
      forwardedValues: {
        queryString: true,
        cookies: {
          forward: "all",
        },
      },
    },
    priceClass: "PriceClass_100",
    customErrorResponses: [{
      errorCode: 404,
      responseCode: 404,
      responsePagePath: "/error.html"
    }],
    orderedCacheBehaviors: [
      // Ensure that some assets that are rebuild but do not change their name are always reloaded
      //    for the APP
      ...getFrontendNoCachingBehaviour(
        frontendBucketOrigin.arn,
        ["/", "/app/",
          "index.html", "/app/index.html",
          "/data/version.json", "/app/data/version.json"],
        urlRewriteFunction),
      //    for the SWAGGER api-doc/swagger
      ...getFrontendNoCachingBehaviour(
        swaggerBucketOrigin.arn,
        ["/taxonomy/api-doc/swagger/", "/taxonomy/api-doc/swagger/tabiya-api.json"],
        urlRewriteFunction),
      ...getFrontendNoCachingBehaviour(
        localesBucketOrigin.arn,
        ["/locales/api/", "/locales/api/locales.json"],
        urlRewriteFunction),
      //    for the REDOC api-doc/redoc
      ...getFrontendNoCachingBehaviour(
        redocBucketOrigin.arn,
        ["/taxonomy/api-doc/redoc/", "/taxonomy/api-doc/redoc/index.html"],
        urlRewriteFunction),
      // APP
      {
        compress: true,
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        targetOriginId: frontendBucketOrigin.arn,
        pathPattern: "/app/*",
        responseHeadersPolicyId: ResponseHeader_ManagedPolicies.SecurityHeadersPolicy,
        cachePolicyId: Cache_ManagedPolicies.CachingOptimized,
        originRequestPolicyId: OriginRequest_ManagedPolicies.CORSS3Origin,
        //defaultTtl: 86400,
        functionAssociations: [
          {
            eventType: "viewer-request",
            functionArn: urlRewriteFunction.arn,
          }
        ],
        viewerProtocolPolicy: "redirect-to-https",
      },
      // LOCALES
      {
        compress: true,
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        targetOriginId: localesBucketOrigin.arn,
        pathPattern: "/locales/api/*",
        responseHeadersPolicyId: ResponseHeader_ManagedPolicies.SecurityHeadersPolicy,
        cachePolicyId: Cache_ManagedPolicies.CachingOptimized,
        originRequestPolicyId: OriginRequest_ManagedPolicies.CORSS3Origin,
        //defaultTtl: 86400,
        functionAssociations: [
          {
            eventType: "viewer-request",
            functionArn: urlRewriteFunction.arn,
          }
        ],
        viewerProtocolPolicy: "redirect-to-https",
      },
      // API
      {
        compress: true,
        allowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
        cachedMethods: ["GET", "HEAD"],
        cachePolicyId: Cache_ManagedPolicies.CachingDisabled,
        responseHeadersPolicyId: ResponseHeader_ManagedPolicies.CORSWithPreflight,
        originRequestPolicyId: OriginRequest_ManagedPolicies.AllViewerExceptHostHeader,
        minTtl: 0,
        maxTtl: 0,
        defaultTtl: 0,
        targetOriginId: backendRestApiOrigin.restApiArn,
        pathPattern: "/taxonomy/api/*",
        functionAssociations: [
          {
            eventType: "viewer-request",
            functionArn: urlRewriteFunction.arn,
          }
        ],
        viewerProtocolPolicy: "redirect-to-https",
      },
      // SWAGGER
      {
        compress: true,
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        targetOriginId: swaggerBucketOrigin.arn,
        pathPattern: "/taxonomy/api-doc/swagger/*",
        responseHeadersPolicyId: ResponseHeader_ManagedPolicies.SecurityHeadersPolicy,
        cachePolicyId: Cache_ManagedPolicies.CachingOptimized,
        originRequestPolicyId: OriginRequest_ManagedPolicies.CORSS3Origin,
        //defaultTtl: 86400,
        functionAssociations: [
          {
            eventType: "viewer-request",
            functionArn: urlRewriteFunction.arn,
          }
        ],
        viewerProtocolPolicy: "redirect-to-https",
      },
      // REDOC
      {
        compress: true,
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        targetOriginId: redocBucketOrigin.arn,
        pathPattern: "/taxonomy/api-doc/redoc/*",
        responseHeadersPolicyId: ResponseHeader_ManagedPolicies.SecurityHeadersPolicy,
        cachePolicyId: Cache_ManagedPolicies.CachingOptimized,
        originRequestPolicyId: OriginRequest_ManagedPolicies.CORSS3Origin,
        //defaultTtl: 86400,
        functionAssociations: [
          {
            eventType: "viewer-request",
            functionArn: urlRewriteFunction.arn,
          }
        ],
        viewerProtocolPolicy: "redirect-to-https",
      },
    ],
    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },
    aliases: [domainName],
    viewerCertificate: {
      acmCertificateArn: certificateArn,
      minimumProtocolVersion: "TLSv1.2_2021",
      sslSupportMethod: "sni-only"
    },
  });

  // Create an alias record for the distribution
  const record = new aws.route53.Record("record", {
    zoneId: hostedZoneId,
    name: domainName,
    type: "A",
    aliases: [
      {
        name: cdn.domainName,
        zoneId: cdn.hostedZoneId,
        evaluateTargetHealth: true,
      },
    ],
  }, {dependsOn: [cdn]});

  return {
    backendURLBase: interpolate`https://${domainName}/taxonomy/api`,
    frontendURLBase: interpolate`https://${domainName}/app`,
    swaggerURLBase: interpolate`https://${domainName}/taxonomy/api-doc/swagger`,
    redocURLBase: interpolate`https://${domainName}/taxonomy/api-doc/redoc`,
    localesURLBase: interpolate`https://${domainName}/locales/api`
  };
}

