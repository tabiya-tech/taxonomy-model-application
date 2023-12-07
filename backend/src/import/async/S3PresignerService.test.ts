// Set up the mock for the S3Client and GetObjectCommand
jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn(),
    GetObjectCommand: jest.fn(),
  };
});
// Set up the mock for the getSignedUrl
jest.mock("@aws-sdk/s3-request-presigner", () => {
  return {
    getSignedUrl: jest.fn().mockResolvedValue("foo/url"),
  };
});

import { S3PresignerService } from "./S3PresignerService";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

describe("Test S3PresignerService", () => {
  test("should construct a new S3PresignerService", () => {
    // GIVEN a region
    const givenRegion = "foo";
    // AND a bucket
    const givenBucket = "bar";

    // WHEN constructing a new S3PresignerService with the given region and bucket
    const actualS3PresignerService = new S3PresignerService(givenRegion, givenBucket);

    // THEN expect the service to be constructed
    expect(actualS3PresignerService).toBeDefined();
  });

  test("should getPresignedGet() successfully", async () => {
    // GIVEN a region
    const givenRegion = "foo";
    // AND a bucket
    const givenBucket = "bar";
    // AND a S3PresignerService constructed with the given region and bucket
    const givenS3PresignerService = new S3PresignerService(givenRegion, givenBucket);
    // AND a file key
    const givenFileKey = "baz";

    // WHEN getPresignedGet function of the given S3PresignerService is called with the file key
    const actualPresigned = await givenS3PresignerService.getPresignedGet(givenFileKey);

    // THEN expect the S3Client to have been called with the correct region
    expect(S3Client).toHaveBeenCalledWith({ region: givenRegion });
    // AND expect the GetObjectCommand to be called with the correct parameters
    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: givenBucket,
      Key: givenFileKey,
    });
    // AND expect the getSignedUrl to return whatever the getSignedUrl returned
    const expectedPresignedURL  = await (getSignedUrl as jest.Mock).mock.results[0].value
    expect(actualPresigned).toEqual(expectedPresignedURL);
  });
});
