// mute the console during the test
import "_test_utilities/consoleMock"

import {processDownloadStream, processStream} from "./processStream";
import {Readable} from "node:stream";
import https from 'https';
import {StatusCodes} from "server/httpUtils";
import {RowProcessor} from "import/parse/RowProcessor.types";

jest.mock('https');

describe("test processStream", () => {
  test("should parse data", async () => {
    // GIVEN a stream of data
    const givenData =
      'name,age\n' +
      'John,30\n' +
      'Alice,25\n' +
      'Bob,35\n';
    const givenStream = Readable.from(givenData);
    // AND some stats
    const givenStats = {
      rowsProcessed: 3,
      rowsSuccess: 3,
      rowsFailed: 0
    }
    // AND a row processor that completes with the given stats
    const givenRowProcessor: RowProcessor<any> = {
      processRow: jest.fn().mockResolvedValue(undefined),
      completed: jest.fn().mockResolvedValue(givenStats),
      validateHeaders: jest.fn().mockResolvedValue(true)
    };

    // WHEN processing the stream
    const actualStats = await processStream(givenStream, givenRowProcessor);

    // THEN expect the given stats to be returned
    expect(actualStats).toEqual(givenStats);
    // AND the headersValidator to have been called once
    expect( givenRowProcessor.validateHeaders).toHaveBeenCalledTimes(1);
    // AND with the correct headers
    expect( givenRowProcessor.validateHeaders).toHaveBeenCalledWith(['NAME', 'AGE']);
    // AND the row processor to have been called 3 times
    expect( givenRowProcessor.processRow).toHaveBeenCalledTimes(3);
    // AND with the correct data (header is converted to uppercase)
    expect( givenRowProcessor.processRow).toHaveBeenNthCalledWith(1, {NAME: 'John', AGE: '30'}, 1);
    expect( givenRowProcessor.processRow).toHaveBeenNthCalledWith(2, {NAME: 'Alice', AGE: '25'}, 2);
    expect( givenRowProcessor.processRow).toHaveBeenNthCalledWith(3, {NAME: 'Bob', AGE: '35'}, 3);
    // AND the completed processor to have been called once
    expect( givenRowProcessor.completed).toHaveBeenCalledTimes(1);
  })

  describe("test processStream with errors", () => {
    test("row process throws an error", async () => {
      // GIVEN a stream of data
      const givenData =
        'name,age\n' +
        'John,30\n' +
        'Alice,25\n' +
        'Bob,35\n';
      const givenStream = Readable.from(givenData);
      // AND a row processor that will throw an error when processing a row
      const givenError = new Error("some error");
      const givenRowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockRejectedValue(givenError),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN processing the stream
      const actualProcessPromise = processStream(givenStream, givenRowProcessor);

      // THEN expect it to reject with the given error
      await expect(actualProcessPromise).rejects.toThrowError(givenError);
    });

    test("readable stream throws an error", async () => {
      // GIVEN a stream of data that will throw an error when the stream is read
      const givenData =
        'name,age\n' +
        'John,30\n' +
        'Alice,25\n' +
        'Bob,35\n';
      const givenStream = Readable.from(givenData);
      // AND row processor that will throw an error when processing a row
      const givenError = new Error("some error");
      givenStream.on('data', () => {
        givenStream.destroy(givenError);
      });
      const givenRowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN processing the stream
      const actualProcessPromise = processStream(givenStream, givenRowProcessor);

      // THEN expect it to reject with the given error
      await expect(actualProcessPromise).rejects.toThrowError(givenError);

    });

    test("csv parser throws error due to invalid data", async () => {
      // GIVEN some invalid data
      const givenData =
        'name,age\n' +
        'John,30, INVALID\n' +
        'Alice,25\n' +
        'Bob,35\n';
      // AND a row processor that will throw an error when processing a row
      const givenRowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN processing the stream of the given data
      const actualProcessPromise = processStream(Readable.from(givenData), givenRowProcessor);

      // THEN expect it to reject with the error
      await expect(actualProcessPromise).rejects.toThrowError("Invalid Record Length: columns length is 2, got 3 on line 2");
    });

    test("csv parser throws an error due to invalid headers", async () => {
      // GIVEN some data
      const givenData =
        'name,age\n' +
        'John,30\n' +
        'Alice,25\n' +
        'Bob,35\n';
      // AND a row processor that will throw an error when processing a row
      const givenRowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        // AND a headers validator that will return false
        validateHeaders: jest.fn().mockResolvedValue(false)
      };

      // WHEN processing the stream of data
      const actualProcessPromise = processStream(Readable.from(givenData), givenRowProcessor);

      // THEN expect it to reject with the error
      await expect(actualProcessPromise).rejects.toThrowError("Invalid headers");
    });
  })
});

describe("test processDownloadStream", () => {
  test("should download and parse data", async () => {
    // GIVEN a url to a csv file
    const givenUrl = 'https://foo/bar.csv';
    // AND some data to be downloaded
    const givenData =
      'name,age\n' +
      'John,30\n' +
      'Alice,25\n' +
      'Bob,35\n';
    // AND the response that returns the expected data
    const givenMockResponse = Readable.from(givenData);
    // @ts-ignore
    givenMockResponse.statusCode = StatusCodes.OK; // Set the status code
    (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
      callback(givenMockResponse);
      return {
        on: jest.fn(),
      };
    });
    // AND some stats
    const givenStats = {
      rowsProcessed: 3,
      rowsSuccess: 3,
      rowsFailed: 0
    }
    // AND a row processor that complete with the given stats
    const givenRowProcessor: RowProcessor<any> = {
      processRow: jest.fn().mockResolvedValue(undefined),
      completed: jest.fn().mockResolvedValue(givenStats),
      validateHeaders: jest.fn().mockResolvedValue(true)
    };

    // WHEN downloading and processing the file
    const actualStats = await processDownloadStream(givenUrl, givenRowProcessor);

    // THEN expect the returned stats to be the same as the given ones
    expect(actualStats).toEqual(givenStats);
    // AND the row processor to have been called with the correct data (header is converted to uppercase)
    expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(1, {NAME: 'John', AGE: '30'}, 1);
    expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(2, {NAME: 'Alice', AGE: '25'}, 2);
    expect(givenRowProcessor.processRow).toHaveBeenNthCalledWith(3, {NAME: 'Bob', AGE: '35'}, 3);
  });

  describe("test processDownloadStream with errors", () => {
    test("should reject if the request fails", async () => {
      // GIVEN a url to a csv file
      const givenUrl = 'https://foo/bar.csv';
      // AND a request that fails (responding with some error)
      const givenError = new Error("some error");
      // @ts-ignore
      (https.get as jest.Mock).mockImplementationOnce(() => {
        return { // Return a mock request
          on: jest.fn((event, callback) => {
            callback(givenError);
          }),
        };
      });
      // AND a row processor that will throw an error when processing a row
      const givenRowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenUrl, givenRowProcessor);

      // THEN expect it to reject with the given error
      await expect(actualProcessPromise).rejects.toThrowError(givenError);
    });

    test("should reject if the response status code is not 200", async () => {
      // GIVEN a url to a csv file
      const givenUrl = 'https://foo/bar.csv';
      // AND a request that fails (responding with 404 status code)
      const givenMockResponse = Readable.from("");
      // @ts-ignore
      givenMockResponse.statusCode = StatusCodes.NOT_FOUND; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(givenMockResponse);
        return { // Return a mock request
          on: jest.fn(),
        };
      });
      // AND a row processor that will throw an error when processing a row
      const givenRowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenUrl, givenRowProcessor);

      // THEN expect it to reject with the error
      await expect(actualProcessPromise).rejects.toThrowError("Failed to download file https://foo/bar.csv. Status Code: 404");
    });

    test("should reject if the response is not readable", async () => {
      // GIVEN a url to a csv file
      const givenUrl = 'https://foo/bar.csv';
      // AND a mock response that will throw an error when the stream is read
      const givenData =
        'name,age\n' +
        'John,30\n' +
        'Alice,25\n' +
        'Bob,35\n';
      const givenMockResponse = Readable.from(givenData);
      const givenError = new Error("some error");
      givenMockResponse.on('data', () => {
        givenMockResponse.destroy(givenError);
      });
      // @ts-ignore
      givenMockResponse.statusCode = StatusCodes.OK; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(givenMockResponse);
        return { // Return a mock request
          on: jest.fn(),
        };
      });
      // AND a row processor that will throw an error when processing a row
      const givenRowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenUrl, givenRowProcessor);

      // THEN expect it to reject with the given error
      await expect(actualProcessPromise).rejects.toThrowError(givenError);
    });

    test("should reject if processStream rejects", async () => {
      // GIVEN a url to a csv file
      const givenUrl = 'https://foo/bar.csv';
      // AND some data to be downloaded
      const givenData =
        'name,age\n' +
        'John,30\n' +
        'Alice,25\n' +
        'Bob,35\n';
      // AND the response that returns the expected data
      const givenMockResponse = Readable.from(givenData);
      // @ts-ignore
      givenMockResponse.statusCode = StatusCodes.OK; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(givenMockResponse);
        return {
          on: jest.fn(),
        };
      });
      // AND a row processor that will throw an error when processing a row
      const givenError = new Error("some error");
      const givenRowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockRejectedValue(givenError),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN downloading and processing the file
      const actualProcessPromise = processDownloadStream(givenUrl, givenRowProcessor);

      // THEN expect it to reject with the given error
      await expect(actualProcessPromise).rejects.toThrowError(givenError);
    });
  });
});