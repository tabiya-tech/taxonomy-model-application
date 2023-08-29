// mute the console during the test
import "src/_test_utilities/consoleMock"

import ImportService from './import.service';
import {ServiceError} from 'src/error/error';
import * as Import from "api-specifications/import";
import {setupFetchSpy} from "src/_test_utilities/fetchSpy";
import {StatusCodes} from "http-status-codes/";
import {ErrorCodes} from "src/error/errorCodes";
import Ajv from "ajv/dist/2020";
import {getTestString} from "src/_test_utilities/specialCharacters";
import {getMockId} from "src/_test_utilities/mockMongoId";

const mockFilePaths: Import.Types.ImportFilePaths = {
  [Import.Types.ImportFileTypes.ESCO_SKILL]: "foo/bar",
  [Import.Types.ImportFileTypes.OCCUPATION_HIERARCHY]: "bar/baz",
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
    // AND the upload of the files will succeed
    const fetchSpy = setupFetchSpy(StatusCodes.ACCEPTED, undefined, "");

    // WHEN calling the import method with the given arguments (modelId, filePaths)
    const importService = new ImportService(givenApiServerUrl);
    await importService.import(givenModelId, givenFilePaths);

    // THEN Expect to make a POST request
    // AND the headers
    // AND the request jsonPayload to contain the given arguments (givenModelId, givenFilePaths)
    const expectedPayload: Import.Types.ImportRequest = {
      modelId: givenModelId,
      filePaths: givenFilePaths
    }
    const expectedJSONPayload = JSON.stringify(expectedPayload);
    expect(fetchSpy).toHaveBeenCalledWith(`${givenApiServerUrl}/import`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: expectedJSONPayload,
    });
    // AND the body conforms to the  ImportSchema schema
    const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    const validateRequest = ajv.compile(Import.Schema.POST.Request);
    validateRequest(expectedPayload);
    expect(validateRequest.errors).toBeNull();
  });

  test("on fail to fetch, it should reject with an error ERROR_CODE.FETCH_FAILED that contains information about the error", async () => {
    // GIVEN url, modelId and filePaths
    const givenApiServerUrl = "/path/to/api";
    const givenModelId = getMockId(1);
    const givenFilePaths = mockFilePaths;
    // AND the fetch of some of the files will fail with some error.
    const givenError = new Error("some error");
    jest.spyOn(window, 'fetch').mockRejectedValue(givenError);

    // WHEN calling the import method with the given arguments (modelId, filePaths)
    const importService = new ImportService(givenApiServerUrl);
    const importPromise = importService.import(givenModelId, givenFilePaths);

    // THEN Expect to reject with an error
    const expectedError = {
      ...new ServiceError("ImportService", "import", "POST", `${givenApiServerUrl}/import`, StatusCodes.NOT_FOUND, ErrorCodes.FAILED_TO_FETCH, "", ""),
      statusCode: expect.any(Number),
      message: expect.any(String),
      details: expect.any(Error),
    };
    await expect(importPromise).rejects.toMatchObject(expectedError);
  });

  test("on NOT 202, it should reject with an error ERROR_CODE.FETCH_FAILED that contains information about the error", async () => {
    // GIVEN url, modelId and filePaths
    const givenApiServerUrl = getMockId(1);
    const givenModelId = "modelId";
    const givenFilePaths = mockFilePaths;
    // AND the fetch of some of the files will respond with a status code other than 204.
    const givenFailureStatusCode = StatusCodes.BAD_REQUEST;
    setupFetchSpy(givenFailureStatusCode, undefined, "");

    // WHEN calling the import method with the given arguments (modelId, filePaths)
    const importService = new ImportService(givenApiServerUrl);
    const importPromise = importService.import(givenModelId, givenFilePaths);

    // THEN Expect to reject with an error
    const expectedError = {
      ...new ServiceError("ImportService", "import", "POST", `${givenApiServerUrl}/import`, givenFailureStatusCode, ErrorCodes.FAILED_TO_FETCH, "", ""),
      statusCode: expect.any(Number),
      message: expect.any(String),
      details: expect.anything(),
    };
    await expect(importPromise).rejects.toMatchObject(expectedError);
  });
});