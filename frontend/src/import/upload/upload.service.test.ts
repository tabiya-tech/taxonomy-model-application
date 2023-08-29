// mute the console during the test
import "src/_test_utilities/consoleMock"

import UploadService, {MAX_CONCURRENT_UPLOADS} from './upload.service';
import * as Presigned from "api-specifications/presigned";
import {setupFetchSpy} from "src/_test_utilities/fetchSpy";
import {StatusCodes} from "http-status-codes";
import {ServiceError} from "src/error/error";
import {ErrorCodes} from "src/error/errorCodes";


function getMockFiles(count: number): File[] {
  const demoFiles: File[] = [];
  const SIZE_1_MB = 1024 * 1024;
  const array = new ArrayBuffer(SIZE_1_MB);
  for (let i = 0; i < count; i++) {
    demoFiles.push(new File([array], `demoFile${i}.txt`));
  }
  return demoFiles;
}

const presignedMock: Presigned.Types.IPresignedResponse = {
  url: "https://example.com",
  fields: [
    {
      name: "some name",
      value: "value"
    }],
  folder: "some folder"
}

describe("Test the service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully upload the files", async () => {
    // GIVEN some files
    const givenFiles = getMockFiles(13);
    // AND a IPreSignedResponse
    const givenPreSigned: Presigned.Types.IPresignedResponse = presignedMock;
    // AND the upload of the files will succeed
    setupFetchSpy(StatusCodes.NO_CONTENT, undefined, "");

    // WHEN calling the uploadFiles method with the given arguments (preSigned, files)
    const uploadService = new UploadService();
    await uploadService.uploadFiles(givenPreSigned, givenFiles);

    // THEN Expect fetch to be called for each file
    expect(fetch).toHaveBeenCalledTimes(givenFiles.length);
    expect(fetch).toHaveBeenCalledWith(givenPreSigned.url, {
      method: "POST",
      body: expect.any(FormData),
    });
  });

  test("on fail to upload, it should reject with an error ERROR_CODE.FETCH_FAILED that contains information about the error", async () => {
    // GIVEN some files
    const givenFiles = getMockFiles(13);
    // AND a IPreSignedResponse
    const givenPreSigned: Presigned.Types.IPresignedResponse = presignedMock;
    // AND the fetch of some of the files will fail with some error.
    const givenError = new Error("some error");
    jest.spyOn(window, 'fetch').mockRejectedValue(givenError);

    // WHEN calling the uploadFiles method with the given arguments (preSigned, files)
    const uploadService = new UploadService();
    const uploadPromise = uploadService.uploadFiles(givenPreSigned, givenFiles);

    // THEN Expect the uploadFiles to reject with the error
    const expectedError = {
      ...new ServiceError("UploadService", "uploadFiles", "POST", givenPreSigned.url, 0, ErrorCodes.FAILED_TO_FETCH, "", ""),
      statusCode: expect.any(Number),
      message: expect.any(String),
      details: expect.anything(),
    };
    await expect(uploadPromise).rejects.toMatchObject(expectedError);
  });

  test("on NOT 204, it should reject with an error ERROR_CODE.FETCH_FAILED that contains information about the error", async () => {
    // GIVEN some files
    const givenFiles = getMockFiles(13);
    // AND a IPreSignedResponse
    const givenPreSigned: Presigned.Types.IPresignedResponse = presignedMock;
    // AND the fetch of some of the files will respond with a status code other than 204.
    const givenFailureStatusCode = StatusCodes.BAD_REQUEST;
    setupFetchSpy(givenFailureStatusCode, undefined, "");

    // WHEN calling the uploadFiles method with the given arguments (preSigned, files)
    const uploadService = new UploadService();
    const uploadPromise = uploadService.uploadFiles(givenPreSigned, givenFiles);

    // THEN Expect the uploadFiles to reject with the error
    const expectedError = {
      ...new ServiceError("UploadService", "uploadFiles", "POST", givenPreSigned.url, givenFailureStatusCode, ErrorCodes.FAILED_TO_FETCH, "", ""),
      statusCode: expect.any(Number),
      message: expect.any(String),
      details: expect.anything(),
    };
    await expect(uploadPromise).rejects.toMatchObject(expectedError);
  });

  test("should limit the concurrent uploads of files to 4", async () => {
    // GIVEN some files > MAX_CONCURRENT_UPLOADS
    const givenFiles = getMockFiles(MAX_CONCURRENT_UPLOADS + 1);
    // add guard to ensure that we have more than MAX_CONCURRENT_UPLOADS files
    expect(givenFiles.length).toBeGreaterThan(MAX_CONCURRENT_UPLOADS);
    // AND a IPreSignedResponse
    const givenPreSigned: Presigned.Types.IPresignedResponse = presignedMock
    // AND the upload of the files will succeed
    let counter = 0;
    let max = 0;
    const countConcurrentCallsPromise = new Promise<void>((resolve) => {
      counter++;
      max = Math.max(counter, max);
      resolve();
    }).then(() => {
      counter--;
      return new Response(undefined, {
        status: 204,
      });
    });
    jest.spyOn(window, 'fetch').mockReturnValue(countConcurrentCallsPromise);

    // WHEN calling the uploadFiles method with the given arguments (preSigned, files)
    const uploadService = new UploadService();
    await uploadService.uploadFiles(givenPreSigned, givenFiles);

    // THEN Expect fetch to be called for each file
    expect(fetch).toHaveBeenCalledTimes(givenFiles.length);

    // AND Expect the maximum concurrency is less than or equal to the MAX_CONCURRENT_UPLOADS
    expect(max).toBeLessThanOrEqual(MAX_CONCURRENT_UPLOADS);
  });
});
