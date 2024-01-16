import { getServiceErrorFactory, ServiceErrorDetails } from "src/error/error";
import { StatusCodes } from "http-status-codes";
import { ErrorCodes } from "src/error/errorCodes";

export default class ExportService {
  readonly apiServerUrl: string;
  readonly exportEndpointUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
    this.exportEndpointUrl = `${apiServerUrl}/export`;
  }

  async exportModel(modelId: string): Promise<string> {
    const errorFactory = getServiceErrorFactory("ExportService", "exportModel", "POST", this.exportEndpointUrl);

    let response;
    try {
      response = await fetch(this.exportEndpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modelId }),
      });
    } catch (e: unknown) {
      throw errorFactory(
        0,
        ErrorCodes.FAILED_TO_FETCH,
        `Failed to export model with ID ${modelId}`,
        e as ServiceErrorDetails
      );
    }

    if (response.status !== StatusCodes.ACCEPTED) {
      throw errorFactory(response.status, ErrorCodes.API_ERROR, `Failed to export model with ID ${modelId}`);
    }

    return await response.json();
  }
}
