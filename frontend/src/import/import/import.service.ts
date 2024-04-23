import ImportAPISpecs from "api-specifications/import";
import { StatusCodes } from "http-status-codes";
import { fetchWithAuth } from "src/apiService/APIService";

export default class ImportService {
  readonly apiServerUrl: string;
  readonly importEndpointUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
    this.importEndpointUrl = `${apiServerUrl}/import`;
  }

  async import(
    modelId: string,
    filePaths: ImportAPISpecs.Types.POST.Request.ImportFilePaths,
    isOriginalESCOModel: boolean
  ): Promise<void> {
    const importRequest: ImportAPISpecs.Types.POST.Request.Payload = {
      modelId: modelId,
      filePaths: filePaths,
      isOriginalESCOModel: isOriginalESCOModel,
    };
    await fetchWithAuth(this.importEndpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(importRequest),
      expectedStatusCode: StatusCodes.ACCEPTED,
      serviceName: "ImportService",
      serviceFunction: "import",
      failureMessage: `Failed to import files`,
    });
  }
}
