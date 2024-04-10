import ExportService from "./export.service";
import { setupAPIServiceSpy } from "src/_test_utilities/fetchSpy";
import { StatusCodes } from "http-status-codes";
import { ServiceError } from "src/error/error";
import { ErrorCodes } from "src/error/errorCodes";

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
    });
  });

  test("on fail to fetch, it should reject with an error ERROR_CODE.FAILED_TO_FETCH that contains information about the error", async () => {
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

    // THEN expected it to reject with the error response
    const expectedError = {
      ...new ServiceError(
        ExportService.name,
        "exportModel",
        "POST",
        `${givenApiServerUrl}/export`,
        0,
        ErrorCodes.FAILED_TO_FETCH,
        "",
        ""
      ),
      details: expect.any(Error),
    };
    await expect(exportPromise).rejects.toMatchObject(expectedError);
  });

  test("on NOT 202, it should reject with an error ERROR_CODE.API_ERROR that contains information about the error", async () => {
    // GIVEN a api server url
    const givenApiServerUrl = "/path/to/api";
    // AND a model ID
    const givenModelId = "mockModelId";
    // AND the export model REST API will respond with NOT CREATED
    setupAPIServiceSpy(StatusCodes.BAD_REQUEST, undefined, "application/json;charset=UTF-8");

    // WHEN the exportModel function is called with the given modelId
    const exportService = new ExportService(givenApiServerUrl);
    const exportPromise = exportService.exportModel(givenModelId);

    // THEN expected it to reject with the error response
    const expectedError = {
      ...new ServiceError(
        ExportService.name,
        "exportModel",
        "POST",
        `${givenApiServerUrl}/export`,
        0,
        ErrorCodes.API_ERROR,
        ""
      ),
      statusCode: expect.any(Number),
      message: expect.any(String),
    };
    await expect(exportPromise).rejects.toMatchObject(expectedError);
  });
});
