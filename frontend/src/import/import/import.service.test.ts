// mute the console during the test
import "src/_test_utilities/consoleMock"

import ImportService from './import.service';
import {ServiceError} from '../../error/error';
import {ImportFileTypes} from "api-specifications/import";
import {setupFetchSpy} from "../../_test_utilities/fetchSpy";
import {StatusCodes} from "http-status-codes/";
import {ErrorCodes} from "../../error/errorCodes";
const mockFileUrls: {[key in ImportFileTypes]: string} = {
    [ImportFileTypes.ESCO_SKILL]: "https://example.com/csv",
    [ImportFileTypes.OCCUPATION_HIERARCHY]: "https://example.com/json"
} as any;
describe("Test the service", () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should successfully import model", async () => {
        // GIVEN url, modelId and fileUrls
        const givenUrl = "https://example.com";
        const givenModelId = "modelId";
        const givenFileUrls=mockFileUrls;
        // AND the upload of the files will succeed
        setupFetchSpy(StatusCodes.ACCEPTED, undefined, "");

        // WHEN calling the import method with the given arguments (modelId, fileUrls)
        const importService = new ImportService(givenUrl);
        await importService.import(givenModelId, givenFileUrls);
        // THEN Expect Accepted to be called
        expect(fetch).toHaveBeenCalledWith(givenUrl + "/import", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                modelId: givenModelId,
                urls: givenFileUrls
            }),
        });
    });

    test("on fail to import, it should reject with an error ERROR_CODE.FETCH_FAILED that contains information about the error", async () => {
        // GIVEN url, modelId and fileUrls
        const givenUrl = "https://example.com";
        const givenModelId = "modelId";
        const givenFileUrls=mockFileUrls;
        // AND the fetch of some of the files will fail with some error.
        const givenError = new Error("some error");
        jest.spyOn(window, 'fetch').mockRejectedValue(givenError);

        // WHEN calling the import method with the given arguments (modelId, fileUrls)
        const importService = new ImportService(givenUrl);
        const importPromise = importService.import(givenModelId, givenFileUrls);
        // THEN Expect Accepted to be called
        const expectedError = {
            ...new ServiceError("ImportService", "import", "POST", givenUrl + "/import", StatusCodes.NOT_FOUND, ErrorCodes.FAILED_TO_FETCH, "", ""),
            statusCode: expect.any(Number),
            message: expect.any(String),
            details: expect.anything(),
        };
        await expect(importPromise).rejects.toMatchObject(expectedError);
    });

    test("on NOT 202, it should reject with an error ERROR_CODE.FETCH_FAILED that contains information about the error", async () => {
        // GIVEN url, modelId and fileUrls
        const givenUrl = "https://example.com";
        const givenModelId = "modelId";
        const givenFileUrls=mockFileUrls;
        // AND the fetch of some of the files will respond with a status code other than 204.
        const givenFailureStatusCode = StatusCodes.BAD_REQUEST;
        setupFetchSpy(givenFailureStatusCode, undefined, "");

        // WHEN calling the import method with the given arguments (modelId, fileUrls)
        const importService = new ImportService(givenUrl);
        const importPromise = importService.import(givenModelId, givenFileUrls);
        // THEN Expect Accepted to be called
        const expectedError = {
            ...new ServiceError("ImportService", "import", "POST", givenUrl + "/import", givenFailureStatusCode, ErrorCodes.FAILED_TO_FETCH, "", ""),
            statusCode: expect.any(Number),
            message: expect.any(String),
            details: expect.anything(),
        };
        await expect(importPromise).rejects.toMatchObject(expectedError);
    });

});
