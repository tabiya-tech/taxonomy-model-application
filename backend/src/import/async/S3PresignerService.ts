import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {S3Client, GetObjectCommand} from "@aws-sdk/client-s3";

const EXPIRES = 60 * 60 * 24; // 24 hours
export class S3PresignerService {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(region: string, bucketName: string) {
    this.client = new S3Client({region: region});
    this.bucketName = bucketName;
  }

  public async getPresignedGet(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey
    });

    //@ts-ignore
    return getSignedUrl(this.client, command, {expiresIn: EXPIRES});
  }
}