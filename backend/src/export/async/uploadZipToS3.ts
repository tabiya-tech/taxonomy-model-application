import { S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import ErrorLogger from "common/errorLogger/errorLogger";
import { Readable } from "node:stream";

const uploadZipToS3 = async (uploadStream: Readable, fileName: string, region: string, bucketName: string) => {
  try {
    const s3Client = new S3({
      region: region,
    });
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: fileName,
        Body: uploadStream,
        ContentType: "application/zip",
      },
    });
    await upload.done();
    console.info(`Zip file ${fileName} successfully uploaded.`);
  } catch (cause: unknown) {
    const err = new Error(`Zip file ${fileName} upload failed.`);
    ErrorLogger.logError(err, cause);
    throw err;
  }
};

export default uploadZipToS3;
