import PresignedAPISpecs from "api-specifications/presigned";
import {getServiceErrorFactory} from "../../error/error";
import {ErrorCodes} from "../../error/errorCodes";
import pLimit from 'p-limit';
import {StatusCodes} from "http-status-codes";

export const MAX_CONCURRENT_UPLOADS = 20;
export default class UploadService {


  async uploadFiles(presigned: PresignedAPISpecs.Types.GET.Response.Payload, files: File[]) {
    try {
      const limit = pLimit(MAX_CONCURRENT_UPLOADS);
      const uploadPromises: Promise<void>[] = [];
      for (const file of files) {
        uploadPromises.push(limit(() => this.uploadFile(presigned, file)));
      }
      await Promise.all(uploadPromises);
    } catch (e) {
      console.error(e)
      throw e;
    }
  }

  private async uploadFile(presigned: PresignedAPISpecs.Types.GET.Response.Payload, file: File) {
    const errorFactory = getServiceErrorFactory("UploadService", "uploadFiles", "POST", presigned.url);

    let responseStatus: number;
    try {

      const formData = new FormData();
      presigned.fields.forEach(field => {
        formData.append(field.name, field.value);
      });
      formData.append("key", presigned.folder + "/" + file.name);
      formData.append("file", file);
      const response = await fetch(presigned.url, {
        method: "POST",
        body: formData
      });
      responseStatus = response.status;
    } catch (e) {
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Failed to upload file", {filename: file.name, error: e});
    }
    if (responseStatus !== StatusCodes.NO_CONTENT) {
      throw errorFactory(responseStatus, ErrorCodes.FAILED_TO_FETCH, "Failed to upload file", {filename: file.name});
    }
  }
}