import { StatusCodes } from "http-status-codes";
import { fetchWithAuth } from "src/apiService/APIService";

export default class ExportService {
  readonly apiServerUrl: string;
  readonly exportEndpointUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
    this.exportEndpointUrl = `${apiServerUrl}/export`;
  }

  async exportModel(modelId: string): Promise<string> {
    let response;
    response = await fetchWithAuth(this.exportEndpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ modelId }),
      expectedStatusCode: StatusCodes.ACCEPTED,
      serviceName: "ExportService",
      serviceFunction: "exportModel",
      failureMessage: `Failed to export model with ID ${modelId}`,
    });

    return await response.json();
  }
}
