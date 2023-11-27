// Mock the chatty console
import "_test_utilities/consoleMock";

import uploadZipToS3 from "./uploadZipToS3";
import { Readable } from "node:stream";
import { S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import errorLogger from "common/errorLogger/errorLogger";

jest.spyOn(errorLogger, "logError");
jest.spyOn(errorLogger, "logWarning");

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3: jest.fn(),
  };
});

jest.mock("@aws-sdk/lib-storage", () => {
  return {
    Upload: jest.fn().mockReturnValue({
      done: jest.fn(),
    }),
  };
});

const givenData = {
  // GIVEN region
  givenRegion: "foo-bar-1",
  // AND a bucket name
  givenBucketName: "foo-bar-bucket",
  // AND a file name
  givenFileName: "foo.bar.zip",
  // AND a readable stream
  givenStream: Readable.from([]),
};
describe("uploadZipToS3", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should construct the S3 client and call upload with correct parameters", () => {
    // GIVEN the S3  will return an S3 client
    (S3 as jest.Mock).mockImplementationOnce((config) => {
      return { ...config }; // just mock to return the config as the client
    });

    // WHEN calling uploadZipToS3 with some stream data and the file name and region and bucket name
    uploadZipToS3(givenData.givenStream, givenData.givenFileName, givenData.givenRegion, givenData.givenBucketName);

    // THEN expect the S3 client to have been instantiated with the given region
    expect(S3).toHaveBeenCalledWith({ region: givenData.givenRegion });
    // AND expect the upload function to have been called with the client and the correct parameters
    expect(Upload).toHaveBeenCalledWith({
      client: { region: givenData.givenRegion }, // assert that the client that was created by the S3 constructor is passed
      params: {
        Bucket: givenData.givenBucketName,
        Key: givenData.givenFileName,
        Body: givenData.givenStream,
        ContentType: "application/zip",
      },
    });
    // AND no error or warning should have been logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
    expect(errorLogger.logWarning).not.toHaveBeenCalled();
  });

  // should resolve when the upload is done
  test("should resolve when the upload is done", async () => {
    // GIVEN the Upload will successfully resolve
    (Upload as unknown as jest.Mock).mockReturnValueOnce({
      done: jest.fn().mockResolvedValueOnce({}),
    });

    // WHEN  uploadZipToS3 is called then expect it to successfully resolve
    await expect(
      uploadZipToS3(givenData.givenStream, givenData.givenFileName, givenData.givenRegion, givenData.givenBucketName)
    ).resolves.toBeUndefined();
  });

  test("should reject when the upload is done", async () => {
    // GIVEN the Upload will reject with an error
    const givenError = new Error("foo");
    (Upload as unknown as jest.Mock).mockReturnValueOnce(() => ({
      done: jest.fn().mockRejectedValueOnce(givenError),
    }));

    // WHEN  uploadZipToS3 is called
    const actualUploadPromise = uploadZipToS3(
      givenData.givenStream,
      givenData.givenFileName,
      givenData.givenRegion,
      givenData.givenBucketName
    );

    // THEN expect it to reject
    await expect(actualUploadPromise).rejects.toThrowError(`Zip file ${givenData.givenFileName} upload failed.`);
    // AND the error should be logged
    expect(errorLogger.logError).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
  });

  test("should reject if constructing the S3 client fails", async () => {
    // GIVEN the Upload will reject with an error
    const givenError = new Error("foo");
    (S3 as unknown as jest.Mock).mockImplementation(() => {
      throw givenError;
    });

    // WHEN  uploadZipToS3 is called
    const actualUploadPromise = uploadZipToS3(
      givenData.givenStream,
      givenData.givenFileName,
      givenData.givenRegion,
      givenData.givenBucketName
    );

    // THEN expect it to reject
    await expect(actualUploadPromise).rejects.toThrowError(`Zip file ${givenData.givenFileName} upload failed.`);
    // AND the error should be logged
    expect(errorLogger.logError).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
  });

  test("should reject if constructing the Upload fails", async () => {
    // GIVEN the Upload will reject with an error
    const givenError = new Error("foo");
    (Upload as unknown as jest.Mock).mockImplementation(() => {
      throw givenError;
    });

    // WHEN  uploadZipToS3 is called
    const actualUploadPromise = uploadZipToS3(
      givenData.givenStream,
      givenData.givenFileName,
      givenData.givenRegion,
      givenData.givenBucketName
    );

    // THEN expect it to reject
    await expect(actualUploadPromise).rejects.toThrowError(`Zip file ${givenData.givenFileName} upload failed.`);
    // AND the error should be logged
    expect(errorLogger.logError).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
  });
});
