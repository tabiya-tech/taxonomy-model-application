import {Bucket} from "@pulumi/aws/s3";
import * as aws from "@pulumi/aws";
import * as synced_folder from "@pulumi/synced-folder";

const swaggerBuildFolderPath = "../../backend/build/openapi/swagger";
const redocBuildFolderPath = "../../backend/build/openapi/redoc";

export function setupSwaggerBucket(domainName: string): Bucket {
  return setupWebBucket('swagger', swaggerBuildFolderPath, domainName);
}

export function setupRedocBucket(domainName: string): Bucket {
  return setupWebBucket('redoc', redocBuildFolderPath, domainName);
}


function setupWebBucket(namePrefix: string, buildFolderPath: string, domainName: string): Bucket {

// Create an AWS resource (S3 Bucket)
  const bucket = new aws.s3.Bucket(`${namePrefix}-bucket`, {
    acl: aws.s3.PrivateAcl,
    website: {
      indexDocument: "index.html",
      errorDocument: "",
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
  const ownershipControls = new aws.s3.BucketOwnershipControls(`${namePrefix}-ownership-controls`, {
    bucket: bucket.bucket,
    rule: {
      objectOwnership: "ObjectWriter",
    }
  });

  // Configure public ACL block on the new S3 bucket
  const publicAccessAllow = new aws.s3.BucketPublicAccessBlock(`${namePrefix}-public-access-block`, {
    bucket: bucket.bucket,
    blockPublicAcls: false,
  });

  new synced_folder.S3BucketFolder(`${namePrefix}-synced-folder`, {
    //disableManagedObjectAliases: true,
    path: buildFolderPath,
    bucketName: bucket.bucket,
    acl: aws.s3.PublicReadAcl,
    managedObjects: true
  }, {dependsOn: [ownershipControls, publicAccessAllow]});

  return bucket;
}
