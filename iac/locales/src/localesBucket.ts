import { Bucket } from "@pulumi/aws/s3";
import * as aws from "@pulumi/aws";
import * as synced_folder from "@pulumi/synced-folder";
import * as pulumi from "@pulumi/pulumi";

const LOCALES_BUCKET_NAME = "locales-bucket"
const LOCALES_FOLDER_PATH = "../../locales/public";

export function setupLocalesBucket(domainName: string): Bucket {
  // Create an AWS resource (S3 Bucket)
  const bucket = new aws.s3.Bucket(LOCALES_BUCKET_NAME, {
    corsRules: [{
      allowedHeaders: ["*"],
      allowedMethods: ["GET"],
      allowedOrigins: [`https://${domainName}`, 'http://localhost:3000', "http://localhost:6006"], // Other domains could want to access the locales e.g. compass domain
      maxAgeSeconds: 3600
    }],
  });

  const bucketPolicy = new aws.s3.BucketPolicy(`${LOCALES_BUCKET_NAME}-bucket-policy`, {
    bucket: bucket.id,
    policy: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: pulumi.interpolate`${bucket.arn}/*`
        },
        {
          Sid: "AllowPrivateReadWrite",
          Effect: "Allow",
          Principal: {
            AWS: "*"
          },
          Action: [
            "s3:PutObject",

          ],
          Resource: pulumi.interpolate`${bucket.arn}/*`
        },
      ]
    },
  }, { dependsOn: [bucket]});

  // Configure ownership controls for the new S3 bucket
  const ownershipControls = new aws.s3.BucketOwnershipControls(`${LOCALES_BUCKET_NAME}-ownership-controls`, {
    bucket: bucket.bucket,
    rule: {
      objectOwnership: "ObjectWriter",
    }
  });

 const publicAccessAllow = new aws.s3.BucketPublicAccessBlock(`${LOCALES_BUCKET_NAME}-public-access-block`, {
   bucket: bucket.bucket,
   blockPublicAcls: false,
   blockPublicPolicy: false,
   ignorePublicAcls: true,
   restrictPublicBuckets: false,
  });

  const _locale_synced_folder = new synced_folder.S3BucketFolder(`${LOCALES_BUCKET_NAME}-synced-folder`, {
    path: LOCALES_FOLDER_PATH,
    bucketName: bucket.bucket,
    acl: aws.s3.PublicReadAcl,
    managedObjects: true
  }, {dependsOn: [ownershipControls, publicAccessAllow, bucketPolicy]});

  return bucket;
}
