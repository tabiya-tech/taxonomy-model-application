import {Bucket} from "@pulumi/aws/s3";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {Output} from "@pulumi/pulumi";

export function setupUploadBucket(allowedOrigins: string[]): Bucket {

// Create an AWS resource (S3 Bucket)
  const uploadBucket = new aws.s3.Bucket("upload-bucket", {
    acl: aws.s3.PrivateAcl,

    corsRules: [{
      allowedHeaders: [""],
      allowedMethods: ["PUT", "POST"],
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
      expiration: {
        days: 1,
      },
      id: "clean-up",
    }],
  });

// Configure ownership controls for the new S3 bucket
  const ownershipControls = new aws.s3.BucketOwnershipControls("upload-bucket-ownership-controls", {
    bucket: uploadBucket.bucket,
    rule: {
      objectOwnership: "ObjectWriter",
    }
  });

  // Configure public ACL block on the new S3 bucket
  const publicAccessAllow = new aws.s3.BucketPublicAccessBlock("upload-bucket-public-access-block", {
    bucket: uploadBucket.bucket,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  });
  return uploadBucket;
}

export function setupUploadBucketPolicy(uploadBucket: Bucket, restApiLambdaRole: aws.iam.Role, asyncLambdaRole: aws.iam.Role): void {
  // Alternatively, you can attach a policy to the lambda function directly. It would work since the lambda function is
  // in the same account as the bucket. However, attaching a policy to the bucket would work even if the lambda is on a different account.
  // See https://repost.aws/knowledge-center/lambda-execution-role-s3-bucket for more details.

  // Configure the bucket policy
  const bucketPolicyDocument: aws.iam.PolicyDocument = {
    Version: "2012-10-17",

    Statement: [
      {
        Sid: "AllowS3ReadWrite",
        Effect: "Allow",
        Principal: {
          "AWS": [restApiLambdaRole.arn, asyncLambdaRole.arn],
        },
        Action: [
          "s3:GetObject",
          "s3:PutObject",
        ],
        Resource: pulumi.interpolate`${uploadBucket.arn}/*`
      },
    ],
  };

// Attach the policy to the S3 bucket
  const myBucketPolicy = new aws.s3.BucketPolicy("upload-bucket-policy", {
    bucket: uploadBucket.id,
    policy: bucketPolicyDocument,
  });
}