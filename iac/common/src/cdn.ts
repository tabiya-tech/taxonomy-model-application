import * as aws from "@pulumi/aws";
import {Distribution, Function} from "@pulumi/aws/cloudfront";
import {Certificate} from "@pulumi/aws/acm";
import {Zone} from "@pulumi/aws/route53";
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

export function setupCDN(frontendBucket: {
  arn: Output<string>,
  websiteEndpoint: Output<string>
}, backendRestApi: {
  restApiArn: Output<string>,
  domainName: Output<string>,
  path: Output<string>
}, cert: Certificate, hostedZone: Zone, domainName: string): {
  backendURLBase: Output<string>,
  frontendURLBase: Output<string>
} {

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
        originId: frontendBucket.arn,
        domainName: frontendBucket.websiteEndpoint,
        customOriginConfig: {
          originProtocolPolicy: "http-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
      },
      {
        originId: backendRestApi.restApiArn,
        domainName: backendRestApi.domainName,
        originPath: backendRestApi.path,
        customOriginConfig: {
          originProtocolPolicy: "https-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
      }
    ],
    defaultCacheBehavior: {
      targetOriginId: frontendBucket.arn,
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
      ...getFrontendNoCachingBehaviour(
        frontendBucket.arn,
        ["/", "/app/",
          "index.html", "/app/index.html",
          "/data/version.json", "/app/data/version.json"],
        urlRewriteFunction),
      // APP
      {
        compress: true,
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        targetOriginId: frontendBucket.arn,
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
        targetOriginId: backendRestApi.restApiArn,
        pathPattern: "/api/*",
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
      acmCertificateArn: cert.arn,
      minimumProtocolVersion: "TLSv1.2_2021",
      sslSupportMethod: "sni-only"
    },
  }, {dependsOn: [cert]});

  // Create an alias record for the distribution
  const record = new aws.route53.Record("record", {
    zoneId: hostedZone.zoneId,
    name: domainName,
    type: "A",
    aliases: [
      {
        name: cdn.domainName,
        zoneId: cdn.hostedZoneId,
        evaluateTargetHealth: true,
      },
    ],
  }, {dependsOn: [cdn, hostedZone]});

  return {
    backendURLBase: interpolate`https://${domainName}/api`,
    frontendURLBase: interpolate`https://${domainName}/app`
  };
}

