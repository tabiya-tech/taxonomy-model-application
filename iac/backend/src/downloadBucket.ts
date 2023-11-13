import {Bucket} from "@pulumi/aws/s3";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function setupDownloadBucket(allowedOrigins: string[]): Bucket {

  // Create an AWS resource (S3 Bucket)
  const downloadBucket = new aws.s3.Bucket("download-bucket", {
    //  acl: aws.s3.PublicReadAcl,

    corsRules: [{
      allowedHeaders: [""],
      allowedMethods: ["GET"],
      allowedOrigins: allowedOrigins,
      maxAgeSeconds: 3600
    }],
    versioning: {
      enabled: false,
      mfaDelete: false
    },
    lifecycleRules: [{
      abortIncompleteMultipartUploadDays: 1,
      enabled: true,
      id: "clean-up",
    }]
  });

  return downloadBucket;
}

export function setupDownloadBucketWritePolicy(downloadBucket: Bucket, asyncExportLambdaRole: aws.iam.Role): void {
  // Alternatively, you can attach a policy to the lambda function directly. It would work since the lambda function is
  // in the same account as the bucket. However, attaching a policy to the bucket would work even if the lambda is on a different account.
  // See https://repost.aws/knowledge-center/lambda-execution-role-s3-bucket for more details.

  // Configure public policies to be allowed on the S3 bucket
  const publicAccessAllow = new aws.s3.BucketPublicAccessBlock("download-bucket-public-access-block", {
    bucket: downloadBucket.bucket,
    blockPublicAcls: true,
    blockPublicPolicy: false,
    ignorePublicAcls: true,
    restrictPublicBuckets: false,
  });

  // Configure the bucket policy
  const bucketPolicyDocument: aws.iam.PolicyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AllowPublicGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: pulumi.interpolate`${downloadBucket.arn}/*`
      },
      /* {
         Sid: "AllowPublicListBucket",
         Effect: "Allow",
         Principal: "*",
         Action: ["s3:ListBucket"],
         Resource: pulumi.interpolate`${downloadBucket.arn}`
       },*/
      {
        Sid: "AllowPrivateReadWrite",
        Effect: "Allow",
        Principal: {
          "AWS": [asyncExportLambdaRole.arn],
        },
        Action: [
          "s3:PutObject",
        ],
        Resource: pulumi.interpolate`${downloadBucket.arn}/*`
      },
    ],
  };

// Attach the policy to the S3 bucket
  const myBucketPolicy = new aws.s3.BucketPolicy("download-bucket-policy", {
    bucket: downloadBucket.id,
    policy: bucketPolicyDocument,
  });
}