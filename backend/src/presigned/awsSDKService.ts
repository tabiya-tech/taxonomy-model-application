import {createPresignedPost, PresignedPost, PresignedPostOptions} from "@aws-sdk/s3-presigned-post";
import {S3Client} from "@aws-sdk/client-s3";

export function s3_getPresignedPost(region: string, bucketName: string, folderName: string, maxFileSize: number, expires: number): Promise<PresignedPost> {
  const client = new S3Client({region: region});
  const params: PresignedPostOptions = {
    Bucket: bucketName,
    // The ${filename} will be automatically replaced by the name of the file provided, see
    // https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTForms.html#sigv4-HTTPPOSTFormFields
    Key: folderName + "/${filename}",
    Fields: {
      acl: 'private',
    },
    Conditions: [
      {bucket: bucketName},
      {acl: "private"},
      ["starts-with", "$key", folderName + "/"],
      ["content-length-range", 0, maxFileSize],
    ],
    Expires: expires,
  };
  return createPresignedPost(client, params);
}