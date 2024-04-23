// mute the console during the test
import "src/_test_utilities/consoleMock";

import ImportService from "./import.service";
import ImportAPISpecs from "api-specifications/import";
import { setupAPIServiceSpy } from "src/_test_utilities/fetchSpy";
import { StatusCodes } from "http-status-codes/";
import Ajv from "ajv/dist/2020";
import { getTestString } from "src/_test_utilities/specialCharacters";
import { getMockId } from "src/_test_utilities/mockMongoId";

const mockFilePaths: ImportAPISpecs.Types.POST.Request.ImportFilePaths = {
  [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS]: "foo/bar",
  [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_HIERARCHY]: "bar/baz",
};

describe("Test the service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should construct the service successfully", () => {
    // GIVEN an api server url
    const apiServerUrl = getTestString(10);

    // WHEN the service is constructed
    const service = new ImportService(apiServerUrl);

    // THEN expect the service to be constructed successfully
    expect(service).toBeDefined();

    // AND the service should have the correct api server url and create model endpoint url
    expect(service.apiServerUrl).toEqual(apiServerUrl);
    expect(service.importEndpointUrl).toEqual(`${apiServerUrl}/import`);
  });

  test("should successfully trigger the import with POST to /import", async () => {
    // GIVEN apiServerUrl, modelId and filePaths
    const givenApiServerUrl = "/path/to/api";
    const givenModelId = getMockId(1);
    const givenFilePaths = mockFilePaths;
    const givenIsOriginalESCOModel = true;
    // AND the upload of the files will succeed
    const fetchSpy = setupAPIServiceSpy(StatusCodes.ACCEPTED, undefined, "");

    // WHEN calling the import method with the given arguments (modelId, filePaths)
    const importService = new ImportService(givenApiServerUrl);
    await importService.import(givenModelId, givenFilePaths, givenIsOriginalESCOModel);

    // THEN Expect to make a POST request
    // AND the headers
    // AND the request jsonPayload to contain the given arguments (givenModelId, givenFilePaths)
    const expectedPayload: ImportAPISpecs.Types.POST.Request.Payload = {
      modelId: givenModelId,
      filePaths: givenFilePaths,
      isOriginalESCOModel: givenIsOriginalESCOModel,
    };
    const expectedJSONPayload = JSON.stringify(expectedPayload);
    expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: expectedJSONPayload,
      expectedStatusCode: StatusCodes.ACCEPTED,
      serviceName: "ImportService",
      serviceFunction: "import",
      failureMessage: `Failed to import files`,
    });
    // AND the body conforms to the  ImportSchema schema
    const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
    const validateRequest = ajv.compile(ImportAPISpecs.Schemas.POST.Request.Payload);
    validateRequest(expectedPayload);
    expect(validateRequest.errors).toBeNull();
  });

  test("on fail to fetch, it should reject with the error thrown by fetchWithAuth", async () => {
    // GIVEN url, modelId and filePaths
    const givenApiServerUrl = "/path/to/api";
    const givenModelId = getMockId(1);
    const givenFilePaths = mockFilePaths;
    const givenIsOriginalESCOModel = true;
    // AND the fetch of some of the files will fail with some error.
    const givenError = new Error("some error");
    jest.spyOn(require("src/apiService/APIService"), "fetchWithAuth").mockImplementationOnce(() => {
      return new Promise(() => {
        throw givenError;
      });
    });

    // WHEN calling the import method with the given arguments (modelId, filePaths)
    const importService = new ImportService(givenApiServerUrl);
    const importPromise = importService.import(givenModelId, givenFilePaths, givenIsOriginalESCOModel);

    // THEN Expect to reject with the same error thrown by fetchWithAuth
    await expect(importPromise).rejects.toMatchObject(givenError);
  });
});
