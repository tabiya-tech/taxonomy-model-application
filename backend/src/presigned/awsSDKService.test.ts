// ####
// Set up the mock for the S3Client
jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn()
  }
});
// Set up the mock for the createPresignedPost
jest.mock("@aws-sdk/s3-presigned-post", () => {
  return {
    createPresignedPost: jest.fn()
  }
});
// ####

import {S3Client} from "@aws-sdk/client-s3";
import {createPresignedPost, PresignedPost} from "@aws-sdk/s3-presigned-post";
import {s3_getPresignedPost} from "./awsSDKService";

describe('test getPresignedPost()', () => {

  it("should call the S3Client with the correct parameters", async () => {
    // GIVEN a region, bucketName, folder, maxFileSize, and expires
    const givenRegion = "foo";
    const givenBucketName = "bar";
    const givenFolder = "baz";
    const givenMaxFileSize = 100;
    const givenExpires = 1000;
    // AND the S3.createPreSignedPost will successfully return a presigned post object
    const givenMockPost: PresignedPost = {
      url: "foo/url",
      fields: {"key1": "value", "key2": "value2"}
    };
    (createPresignedPost as jest.Mock).mockResolvedValueOnce(givenMockPost);

    // WHEN the getPresignedPost() is called with the given parameters
    const actualPostData: PresignedPost = await s3_getPresignedPost(givenRegion, givenBucketName, givenFolder, givenMaxFileSize, givenExpires);

    // THEN it should use the correct region
    expect(S3Client).toHaveBeenCalledWith({region: givenRegion});
    // AND the given region, bucketName, folder, maxFileSize, and expires should be passed to the createPresignedPost()
    const expectedArg = (createPresignedPost as jest.Mock).mock.calls[0][1]
    expect(expectedArg).toMatchSnapshot();
    // AND it should return the presigned post data that was returned from the createPresignedPost()
    expect(actualPostData).toEqual(givenMockPost);
  });
});