import {Bucket} from "@pulumi/aws/s3";
import * as aws from "@pulumi/aws";
import * as synced_folder from "@pulumi/synced-folder";

const buildFolderPath = "../../frontend/build";

export function setupFrontendBucket(domainName: string): Bucket {

// Create an AWS resource (S3 Bucket)
  const bucket = new aws.s3.Bucket("frontend-bucket", {
    acl: aws.s3.PrivateAcl,
    website: {
      indexDocument: "index.html",
      errorDocument: "error.html",
    },
    // cors rules for get, head all headers abd for all origins
    corsRules: [{
      allowedHeaders: [""],
      allowedMethods: ["GET", "HEAD"],
      allowedOrigins: [`https://${domainName}`],
      maxAgeSeconds: 3600
    }]
  });

// Configure ownership controls for the new S3 bucket
  const ownershipControls = new aws.s3.BucketOwnershipControls("ownership-controls", {
    bucket: bucket.bucket,
    rule: {
      objectOwnership: "ObjectWriter",
    }
  });

  // Configure public ACL block on the new S3 bucket
  const publicAccessAllow = new aws.s3.BucketPublicAccessBlock("public-access-block", {
    bucket: bucket.bucket,
    blockPublicAcls: false,
  });

  new synced_folder.S3BucketFolder("synced-folder", {
    //disableManagedObjectAliases: true,
    path: buildFolderPath,
    bucketName: bucket.bucket,
    acl: aws.s3.PublicReadAcl,
    managedObjects: true
  }, {dependsOn: [ownershipControls, publicAccessAllow]});

  return bucket;
}