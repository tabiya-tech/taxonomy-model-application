import {getServiceErrorFactory} from "../../error/error";
import {ErrorCodes} from "../../error/errorCodes";
import {ImportFileTypes,ImportRequest} from "api-specifications/import";
import {StatusCodes} from "http-status-codes";


export default class ImportService {

  readonly apiServerUrl: string;
  readonly importEndpointUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
    this.importEndpointUrl = `${apiServerUrl}/import`;
  }

  async import(modelId:string, fileUrls: {[key in ImportFileTypes]: string}) {
    const errorFactory = getServiceErrorFactory("ImportService", "import", "POST", this.importEndpointUrl);

    let responseStatus: number;
    try {
        const importRequest: ImportRequest = {
            modelId: modelId,
            urls: fileUrls
        }
        const response = await fetch(this.importEndpointUrl, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(importRequest)
        });
        responseStatus = response.status;
    } catch (e) {
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Failed to import files", e);
    }
    if (responseStatus !== StatusCodes.ACCEPTED) {
      throw errorFactory(responseStatus, ErrorCodes.FAILED_TO_FETCH, "Failed to import files", {});
    }
  }
}