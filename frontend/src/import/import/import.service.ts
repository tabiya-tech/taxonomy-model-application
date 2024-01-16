import { getServiceErrorFactory, ServiceErrorDetails } from "src/error/error";
import { ErrorCodes } from "src/error/errorCodes";
import ImportAPISpecs from "api-specifications/import";
import { StatusCodes } from "http-status-codes";

export default class ImportService {
  readonly apiServerUrl: string;
  readonly importEndpointUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
    this.importEndpointUrl = `${apiServerUrl}/import`;
  }

  async import(modelId: string, filePaths: ImportAPISpecs.Types.POST.Request.ImportFilePaths) {
    const errorFactory = getServiceErrorFactory("ImportService", "import", "POST", this.importEndpointUrl);

    let responseStatus: number;
    try {
      const importRequest: ImportAPISpecs.Types.POST.Request.Payload = {
        modelId: modelId,
        filePaths: filePaths,
      };
      const response = await fetch(this.importEndpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(importRequest),
      });
      responseStatus = response.status;
    } catch (e: unknown) {
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Failed to import files", e as ServiceErrorDetails);
    }
    if (responseStatus !== StatusCodes.ACCEPTED) {
      throw errorFactory(responseStatus, ErrorCodes.FAILED_TO_FETCH, "Failed to import files", {});
    }
  }
}
