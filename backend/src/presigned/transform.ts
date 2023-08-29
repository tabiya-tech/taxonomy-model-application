import {PresignedPost} from "@aws-sdk/s3-presigned-post";
import * as Presigned from "api-specifications/presigned";

export function transformPresignedPostDataToResponse(postData: PresignedPost, folder: string): Presigned.Types.IPresignedResponse {
  return {
    url: postData.url,
    fields: Object.entries(postData.fields).filter(([key,]) => key !== "key").map(([key, value]) => ({
      name: key,
      value: value,
    })),
    folder: folder,
  };
}