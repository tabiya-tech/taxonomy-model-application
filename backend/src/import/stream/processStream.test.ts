// mute the console during the test
import "_test_utilities/consoleMock";

import { processDownloadStream, processStream } from "./processStream";
import { Readable } from "node:stream";
import { StatusCodes } from "server/httpUtils";
import { RowProcessor } from "import/parse/RowProcessor.types";
import errorLogger from "common/errorLogger/errorLogger";
import {
  setupMockHTTPS_get,
  setupMockHTTPS_get_fail,
  setupMockHTTPS_request,
  setupMockHTTPS_request_fail,
} from "_test_utilities/mockHTTPS";
import process from "process";

jest.mock("https");

/**
 * A Readable stream that emits an error on the next tick.
 */
class ErroringReadable extends Readable {
  constructor(private error: Error) {
    super();
  }

  _read() {
    // emit error on next tick
    process.nextTick(() => {
      this.destroy(this.error);
    });
  }
}

describe("test processStream", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("should parse data", async () => {
    // GIVEN a stream of data
    const givenData = "name,age\n" + "John,30\n" + "Alice,25\n" + "Bob,35\n";
    const givenStream = Readable.from(givenData);
    // AND a given stream name
    const givenStreamName = "some stream";
    // AND some stats
    const givenStats = {
      rowsProcessed: 3,
      rowsSuccess: 3,
      rowsFailed: 0,
    };
    // AND a row processor that completes with the given stats
    const givenRowProcessor: RowProcessor<object> = {
      processRow: jest.fn().mockResolvedValue(undefined),
      completed: jest.fn().mockResolvedValue(givenStats),
      validateHeaders: jest.fn().mockResolvedValue(true),
    };

    // WHEN processing the stream
    const actualStats = await processStream(givenStreamName, givenStream, givenRowProcessor);

    // THEN expect the given stats to be returned
    expect(actualStats).toEqual(givenStats);
    // AND the headersValidator to have been called once
    expect(givenRowProcessor.validateHeaders).toHaveBeenCalledTimes(1);
    // AND with the correct headers
    expect(givenRowProcessor.validateHeaders).toHaveBeenCalledWith(["NAME", "AGE"]);
    // AND the row processor to have been called 3 times
    expect(givenRowProcessor.processRow).toHaveBeenCalledTimes(3);
    // AND with the correct data (header is converted to uppercase)
    expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(1, { NAME: "John", AGE: "30" }, 1);
    expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(2, { NAME: "Alice", AGE: "25" }, 2);
    expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(3, { NAME: "Bob", AGE: "35" }, 3);
    // AND the completed processor to have been called once
    expect(givenRowProcessor.completed).toHaveBeenCalledTimes(1);

    // AND no error or warning to have been logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
    expect(errorLogger.logWarning).not.toHaveBeenCalled();
  });

  describe("test processStream with errors", () => {
    test("row process throws an error", async () => {
      // GIVEN a stream of data
      const givenData = "name,age\n" + "John,30\n" + "Alice,25\n" + "Bob,35\n";
      const givenStream = Readable.from(givenData);
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND a row processor that will throw an error when processing a row
      const givenError = new Error("some error");
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockRejectedValue(givenError),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };
      // WHEN processing the stream
      const actualProcessPromise = processStream(givenStreamName, givenStream, givenRowProcessor);

      // THEN expect it to reject with the given error
      const expectedErrorMessage = `Error while processing the stream: ${givenStreamName}`;
      await expect(actualProcessPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );

      // AND an error to have been logged
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      expect(errorLogger.logWarning).not.toHaveBeenCalled();

      // Wait for all promises to resolve to close the process
      await new Promise(process.nextTick);
    });

    test("readable stream throws an error", async () => {
      // GIVEN a stream of data that will throw an error when the stream is read
      const givenData = "name,age\n" + "John,30\n" + "Alice,25\n" + "Bob,35\n";
      const givenStream = Readable.from(givenData);
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND row processor that will throw an error when processing a row
      const givenError = new Error("some error");
      givenStream.on("data", () => {
        givenStream.destroy(givenError);
      });
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN processing the stream
      const actualProcessPromise = processStream(givenStreamName, givenStream, givenRowProcessor);

      // THEN expect it to reject with the given error
      await expect(actualProcessPromise).rejects.toThrowError(givenError);

      // AND an error to have been logged
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(`Error from the reading the stream: ${givenStreamName}`, givenError.message)
      );
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("csv parser throws error due to invalid data", async () => {
      // GIVEN some invalid data
      const givenData = "name,age\n" + "John,30, INVALID\n" + "Alice,25\n" + "Bob,35\n";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND a row processor that will throw an error when processing a row
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN processing the stream of the given data
      const actualProcessPromise = processStream(givenStreamName, Readable.from(givenData), givenRowProcessor);

      // THEN expect it to reject with the error
      const expectedErrorMessage = `Error while processing the stream: ${givenStreamName}`;
      const expectedCause = new Error("Invalid Record Length: columns length is 2, got 3 on line 2");
      await expect(actualProcessPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(expectedErrorMessage, expectedCause.message)
      );

      // AND an error to have been logged
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(`Error while processing the stream: ${givenStreamName}`, expectedCause.message)
      );
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("csv parser logs error due to invalid headers", async () => {
      // GIVEN some data
      const givenData = "name,age\n" + "John,30\n" + "Alice,25\n" + "Bob,35\n";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND a row processor that will throw an error when processing a row
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        // AND a headers validator that will return false
        validateHeaders: jest.fn().mockResolvedValue(false),
      };

      // WHEN processing the stream of data
      const actualProcessPromise = processStream(givenStreamName, Readable.from(givenData), givenRowProcessor);

      // THEN expect it to resolve with no row processed
      const expectedStats = { rowsProcessed: 0, rowsFailed: 0, rowsSuccess: 0 };
      await expect(actualProcessPromise).resolves.toEqual(expectedStats);

      // AND an error to have been logged
      const expectedError = new Error(`Invalid headers:NAME,AGE in stream:${givenStreamName}`);
      expect(errorLogger.logError).toHaveBeenCalledWith(expectedError);
      expect(errorLogger.logWarning).not.toHaveBeenCalled();

      // Wait for all promises to resolve to close the process
      await new Promise(process.nextTick);
    });
  });
});

describe("test processDownloadStream", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("test processDownloadStream success", () => {
    test("should download and parse data", async () => {
      // GIVEN a url to a csv file
      const givenUrl = "https://foo/bar.csv";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND some data to be downloaded
      const givenData = "name,age\n" + "John,30\n" + "Alice,25\n" + "Bob,35\n";
      // AND the response that returns the expected data
      //  the first call to https.request is for the HEAD request to check if the file can be downloaded
      setupMockHTTPS_request(Readable.from(""), StatusCodes.PARTIAL_CONTENT);
      // the second call to https.get is for the actual GET request to download the file and process it
      const givenMockResponse = Readable.from(givenData);
      setupMockHTTPS_get(givenMockResponse, StatusCodes.OK);
      // AND some stats
      const givenStats = {
        rowsProcessed: 3,
        rowsSuccess: 3,
        rowsFailed: 0,
      };
      // AND a row processor that complete with the given stats
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(givenStats),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN downloading and processing the file
      const actualStats = await processDownloadStream(givenStreamName, givenUrl, givenRowProcessor);

      // THEN expect the returned stats to be the same as the given ones
      expect(actualStats).toEqual(givenStats);
      // AND the row processor to have been called with the correct data (header is converted to uppercase)
      expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(1, { NAME: "John", AGE: "30" }, 1);
      expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(2, { NAME: "Alice", AGE: "25" }, 2);
      expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(3, { NAME: "Bob", AGE: "35" }, 3);
      // AND no error or warning to have been logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("should retry and succeed, if the request to check if the file can be downloaded fails once with a connection error", async () => {
      jest.useFakeTimers();
      // GIVEN a url to a csv file
      const givenUrl = "https://foo/bar.csv";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND some data to be downloaded
      const givenData = "name,age\n" + "John,30\n" + "Alice,25\n" + "Bob,35\n";
      // AND the response that returns the expected data.
      //  The first call to https.request is for the HEAD request to check if the file can be downloaded
      //  the first call will fail with a connection error, but the second call will succeed
      setupMockHTTPS_request_fail(new Error("Connection error"));
      //  The second call to https.request is for the HEAD request to check if the file can be downloaded
      setupMockHTTPS_request(Readable.from(""), StatusCodes.PARTIAL_CONTENT);
      // the second call to https.get is for the actual GET request to download the file and process it
      const givenMockResponse = Readable.from(givenData);
      setupMockHTTPS_get(givenMockResponse, StatusCodes.OK);
      // AND some stats
      const givenStats = {
        rowsProcessed: 3,
        rowsSuccess: 3,
        rowsFailed: 0,
      };
      // AND a row processor that complete with the given stats
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(givenStats),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenStreamName, givenUrl, givenRowProcessor);

      // Advance the fake timer by 5000 ms to simulate the HEAD request timeout
      await jest.advanceTimersByTimeAsync(5000);

      // Advance the fake timer by 2000 ms to simulate the retry delay before the next attempt
      await jest.advanceTimersByTimeAsync(2000);

      // Run all pending microtasks (e.g., Promise callbacks, retry setup, https.get trigger)
      jest.runAllTicks();

      const actualStats = await actualProcessPromise;
      // THEN expect the returned stats to be the same as the given ones
      expect(actualStats).toEqual(givenStats);
      // AND the row processor to have been called with the correct data (header is converted to uppercase)
      expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(1, { NAME: "John", AGE: "30" }, 1);
      expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(2, { NAME: "Alice", AGE: "25" }, 2);
      expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(3, { NAME: "Bob", AGE: "35" }, 3);
      // AND no error or warning to have been logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
      expect(errorLogger.logWarning).not.toHaveBeenCalled();

      // AND a warning was logged in the console about the retry
      expect(console.warn).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(`Health check attempt 1 failed for some stream`, "Connection error")
      );
    });

    test("should retry and succeed, if the request to check if the file can be downloaded fails once with an unexpected status code (not 200 or 206)", async () => {
      jest.useFakeTimers();
      // GIVEN a url to a csv file
      const givenUrl = "https://foo/bar.csv";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND some data to be downloaded
      const givenData = "name,age\n" + "John,30\n" + "Alice,25\n" + "Bob,35\n";
      // AND the response that returns the expected data.
      //  The first call to https.request is for the HEAD request to check if the file can be downloaded
      //  the first call will fail with a connection error, but the second call will succeed
      setupMockHTTPS_request(Readable.from(""), StatusCodes.INTERNAL_SERVER_ERROR);
      //  The second call to https.request is for the HEAD request to check if the file can be downloaded
      setupMockHTTPS_request(Readable.from(""), StatusCodes.OK);
      // the second call to https.get is for the actual GET request to download the file and process it
      const givenMockResponse = Readable.from(givenData);
      setupMockHTTPS_get(givenMockResponse, StatusCodes.OK);
      // AND some stats
      const givenStats = {
        rowsProcessed: 3,
        rowsSuccess: 3,
        rowsFailed: 0,
      };
      // AND a row processor that complete with the given stats
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(givenStats),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenStreamName, givenUrl, givenRowProcessor);

      // Advance the fake timer by 5000ms to simulate the HEAD request timeout
      await jest.advanceTimersByTimeAsync(5000);

      // Advance the fake timer by 2000ms to simulate the retry delay before the next attempt
      await jest.advanceTimersByTimeAsync(2000);

      // Run all pending microtasks (e.g., Promise callbacks, retry setup, https.get trigger)
      jest.runAllTicks();

      const actualStats = await actualProcessPromise;
      // THEN expect the returned stats to be the same as the given ones
      expect(actualStats).toEqual(givenStats);
      // AND the row processor to have been called with the correct data (header is converted to uppercase)
      expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(1, { NAME: "John", AGE: "30" }, 1);
      expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(2, { NAME: "Alice", AGE: "25" }, 2);
      expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(3, { NAME: "Bob", AGE: "35" }, 3);
      // AND no error or warning to have been logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
      expect(errorLogger.logWarning).not.toHaveBeenCalled();

      // AND a warning was logged in the console about the retry
      expect(console.warn).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(
          `Health check attempt 1 failed for some stream`,
          `Range check failed: status ${StatusCodes.INTERNAL_SERVER_ERROR}`
        )
      );
    });
  });

  describe("test processDownloadStream with errors", () => {
    afterEach(() => {
      // Restore timers to real timers after each test
      jest.useRealTimers();
    });

    test("should retry give up, if the request to check if the file can be downloaded fails continuously with a connection error", async () => {
      jest.useFakeTimers();
      // GIVEN a URL to a csv file
      const givenUrl = "https://foo/bar.csv";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND a get request that fails (responding with some error).
      //  The first call to https.request is for the HEAD request to check if the file can be downloaded.
      //  This will be mocked to throw an error as many times as the max attempts
      const MAX_ATTEMPTS = 5;
      const givenErrorMessage = "some error";

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        setupMockHTTPS_request_fail(new Error(`${givenErrorMessage} ${i}`));
      }
      // The second call to https.get is for the actual GET request to download the file and process it.
      // This will not be mocked, as is not expected to be called, as the first request will fail.
      // setupMockHTTPS_get(Readable.from(""), StatusCodes.OK);
      // AND a row processor that will succeed
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenUrl, givenStreamName, givenRowProcessor);

      // Advance time to simulate retries and internal timeouts
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        // each retry: HEAD timeout + delay
        await jest.advanceTimersByTimeAsync(5000 + 2000);
        // allow microtasks to run (i.e. promise rejection inside the try/catch)
        await Promise.resolve();
      }

      // THEN expect it to reject with the given error
      await expect(actualProcessPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          `All ${MAX_ATTEMPTS} health-check attempts failed for ${givenUrl}`,
          `${givenErrorMessage} ${MAX_ATTEMPTS - 1}`
        )
      );

      // AND an error to have been logged
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(
          `All ${MAX_ATTEMPTS} health-check attempts failed for ${givenUrl}`,
          `${givenErrorMessage} ${MAX_ATTEMPTS - 1}`
        )
      );
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("should retry give up, if the request to check if the file can be downloaded fails continuously with an unexpected status code (not 200 or 206)", async () => {
      jest.useFakeTimers();
      // GIVEN a URL to a csv file
      const givenUrl = "https://foo/bar.csv";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND a get request that fails (responding with some error).
      //  The first call to https.request is for the HEAD request to check if the file can be downloaded.
      //  This will be mocked to respond with an error status code as many times as the max attempts.
      const givenStatusCode = StatusCodes.NOT_FOUND;
      const MAX_ATTEMPTS = 5;

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        setupMockHTTPS_request(Readable.from(""), givenStatusCode);
      }

      // The second call to https.get is for the actual GET request to download the file and process it.
      // This will not be mocked, but it is not expected to be called, as the first request will fail
      //   setupMockHTTPS_get(Readable.from(""), givenStatusCode);
      // AND a row processor that will succeed
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenUrl, givenStreamName, givenRowProcessor);

      // Advance time to simulate retries and internal timeouts
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        // each retry: HEAD timeout + delay
        await jest.advanceTimersByTimeAsync(5000 + 2000);
        // allow microtasks to run (i.e. promise rejection inside the try/catch)
        await Promise.resolve();
      }
      // THEN expect it to reject with the given error
      await expect(actualProcessPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          `All ${MAX_ATTEMPTS} health-check attempts failed for ${givenUrl}`,
          `Range check failed: status ${givenStatusCode}`
        )
      );

      // AND an error to have been logged
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(
          `All ${MAX_ATTEMPTS} health-check attempts failed for ${givenUrl}`,
          `Range check failed: status ${givenStatusCode}`
        )
      );
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("should reject if the request fails", async () => {
      // GIVEN a URL to a csv file
      const givenUrl = "https://foo/bar.csv";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND a get request that fails (responding with some error)
      //  the first call to https.request is for the HEAD request to check if the file can be downloaded
      setupMockHTTPS_request(Readable.from(""), StatusCodes.PARTIAL_CONTENT);
      // the second call to https.get is for the actual GET request to download the file and process it
      // this will be mocked to throw an error
      const givenError = new Error("some error");
      setupMockHTTPS_get_fail(givenError);
      // AND a row processor that will succeed
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenUrl, givenStreamName, givenRowProcessor);

      // THEN expect it to reject with the given error
      await expect(actualProcessPromise).rejects.toThrow(
        expect.toMatchErrorWithCause("Failed to download file https://foo/bar.csv for some stream", givenError.message)
      );

      // AND an error to have been logged
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(`Failed to download file ${givenUrl} for ${givenStreamName}`, givenError.message)
      );
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("should reject if the response status code is not 200", async () => {
      // GIVEN a URL to a csv file
      const givenUrl = "https://foo/bar.csv";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND a request that fails (responding with 404 status code)
      //  the first call to https.request is for the HEAD request to check if the file can be downloaded
      setupMockHTTPS_request(Readable.from(""), StatusCodes.PARTIAL_CONTENT);
      // the second call to https.get is for the actual GET request to download the file and process it
      const givenMockResponse = Readable.from("");
      setupMockHTTPS_get(givenMockResponse, StatusCodes.NOT_FOUND);
      // AND a row processor that will succeed
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenUrl, givenStreamName, givenRowProcessor);

      // THEN expect it to reject with the error
      const expectedError = new Error(
        `Failed to download file ${givenUrl} for ${givenStreamName}. Status Code: ${StatusCodes.NOT_FOUND}`
      );
      await expect(actualProcessPromise).rejects.toThrowError(expectedError);
      // AND an error to have been logged
      expect(errorLogger.logError).toHaveBeenCalledWith(expectedError);
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("should reject if the response stream is not readable", async () => {
      // GIVEN a URL a csv file
      const givenUrl = "https://foo/bar.csv";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND a request that will throw an error when the stream is read
      //  the first call to https.request is for the HEAD request to check if the file can be downloaded
      setupMockHTTPS_request(Readable.from(""), StatusCodes.PARTIAL_CONTENT);
      // the second call to https.get is for the actual GET request to download the file and process it
      const givenError = new Error("some error");
      const givenMockResponse = new ErroringReadable(givenError);
      setupMockHTTPS_get(givenMockResponse, StatusCodes.OK);
      // AND a row processor that will succeed
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenUrl, givenStreamName, givenRowProcessor);

      // THEN expect it to reject with the given error
      await expect(actualProcessPromise).rejects.toThrow(
        expect.toMatchErrorWithCause("Error while processing https://foo/bar.csv for some stream", givenError.message)
      );
      // AND an error to have been logged
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(`Error from the reading the stream: ${givenStreamName}`, givenError.message)
      );
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("should reject if processStream rejects", async () => {
      // GIVEN a URL to a csv file
      const givenUrl = "https://foo/bar.csv";
      // AND a given stream name
      const givenStreamName = "some stream";
      // AND some data to be downloaded
      const givenData = "name,age\n" + "John,30\n" + "Alice,25\n" + "Bob,35\n";
      // AND the response that returns the expected data
      //  the first call to https.request is for the HEAD request to check if the file can be downloaded
      setupMockHTTPS_request(Readable.from(""), StatusCodes.PARTIAL_CONTENT);
      // the second call to https.get is for the actual GET request to download the file and process it
      const givenMockResponse = Readable.from(givenData);
      setupMockHTTPS_get(givenMockResponse, StatusCodes.OK);
      // AND a row processor that will throw an error when processing a row
      const givenError = new Error("some error");
      const givenRowProcessor: RowProcessor<object> = {
        processRow: jest.fn().mockRejectedValue(givenError),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true),
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenUrl, givenStreamName, givenRowProcessor);

      // THEN expect it to reject with the given error
      const expectedErrorMessage = `Error while processing ${givenUrl} for ${givenStreamName}`;
      await expect(actualProcessPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(expectedErrorMessage, `Error while processing the stream: ${givenStreamName}`)
      );

      // AND an error to have been logged
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(`Error while processing the stream: ${givenStreamName}`, givenError.message)
      );
      expect(errorLogger.logWarning).not.toHaveBeenCalled();

      // Wait for all promises to resolve to close the process
      await new Promise(process.nextTick);
    });
  });
});
