import ExportService from "./export.service";
import { setupAPIServiceSpy } from "src/_test_utilities/fetchSpy";
import { StatusCodes } from "http-status-codes";

describe("Test exportModel service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should construct the service successfully", () => {
    // GIVEN an api server url
    const apiServerUrl = "/path/to/api";

    // WHEN the service is constructed
    const exportService = new ExportService(apiServerUrl);

    // THEN expect the service to be constructed successfully
    expect(exportService).toBeDefined();
    // AND the service should have the correct api server url and export model endpoint url
    expect(exportService.apiServerUrl).toEqual(apiServerUrl);
    expect(exportService.exportEndpointUrl).toEqual(`${apiServerUrl}/export`);
  });

  test("should successfully trigger the export with POST to /export", async () => {
    // GIVEN an API server URL
    const givenApiServerUrl = "/path/to/api";
    // AND a model ID
    const givenModelId = "mockModelId";
    const fetchSpy = setupAPIServiceSpy(
      StatusCodes.ACCEPTED,
      { message: "export started" },
      "application/json;charset=UTF-8"
    );

    // WHEN the exportModel function is called with the given modelId
    const exportService = new ExportService(givenApiServerUrl);
    const exportPromise = exportService.exportModel(givenModelId);

    // THEN expect it to make a POST request
    await expect(exportPromise).resolves.toEqual({ message: "export started" });
    // AND the request to contain the correct headers and payload to contain the given modelId
    expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: givenModelId }),
      expectedStatusCode: StatusCodes.ACCEPTED,
      serviceName: "ExportService",
      serviceFunction: "exportModel",
      failureMessage: `Failed to export model with ID ${givenModelId}`,
    });
  });

  test("on fail to fetch, it should reject with the error thrown by fetchWithAuth", async () => {
    // GIVEN fetch rejects with some unknown error
    const givenFetchError = new Error();
    jest.spyOn(require("src/apiService/APIService"), "fetchWithAuth").mockImplementationOnce(() => {
      return new Promise(() => {
        throw givenFetchError;
      });
    });
    // AND an API server URL
    const givenApiServerUrl = "/path/to/api";
    // AND a model ID
    const givenModelId = "mockModelId";

    // WHEN the exportModel function is called with the given modelId
    const exportService = new ExportService(givenApiServerUrl);
    const exportPromise = exportService.exportModel(givenModelId);

    // THEN expected it to reject with the same error thrown by fetchWithAuth
    await expect(exportPromise).rejects.toMatchObject(givenFetchError);
  });
});
