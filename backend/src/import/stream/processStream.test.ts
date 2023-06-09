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
    const stream = Readable.from(givenData);
    // AND a row processor that returns some stats
    const givenStats = {
      rowsProcessed: 3,
      rowsSuccess: 3,
      rowsFailed: 0
    }
    const rowProcessor: RowProcessor<any> = {
      processRow: jest.fn().mockResolvedValue(undefined),
      completed: jest.fn().mockResolvedValue(givenStats),
      validateHeaders: jest.fn().mockResolvedValue(true)
    };

    // WHEN the stream is processed
    const actualStats = await processStream(stream, rowProcessor);

    // THEN the expected stats is returned
    expect(actualStats).toEqual(givenStats);
    // AND expect the headersValidator to have been called once
    expect(rowProcessor.validateHeaders).toHaveBeenCalledTimes(1);
    // AND expect the headersValidator to have been called with the correct headers
    expect(rowProcessor.validateHeaders).toHaveBeenCalledWith(['NAME', 'AGE']);
    // AND expect the row processor to have been called 3 times
    expect(rowProcessor.processRow).toHaveBeenCalledTimes(3);
    // AND expect the row processor to have been called with the correct data (header is converted to uppercase)
    expect(rowProcessor.processRow).toHaveBeenNthCalledWith(1, {NAME: 'John', AGE: '30'}, 1);
    expect(rowProcessor.processRow).toHaveBeenNthCalledWith(2, {NAME: 'Alice', AGE: '25'}, 2);
    expect(rowProcessor.processRow).toHaveBeenNthCalledWith(3, {NAME: 'Bob', AGE: '35'}, 3);
    // AND expect the completed processor to have been called once
    expect(rowProcessor.completed).toHaveBeenCalledTimes(1);
  })

  describe("test processStream with errors", () => {
    test("row process throws error", async () => {
      // GIVEN a stream of data
      const givenData =
        'name,age\n' +
        'John,30\n' +
        'Alice,25\n' +
        'Bob,35\n';
      const stream = Readable.from(givenData);
      // AND row process that will error when processing a row
      const givenError = new Error("some error");
      const rowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockRejectedValue(givenError),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN the stream is processed
      const processPromise = processStream(stream, rowProcessor);

      // THEN expect it to reject with the given error
      await expect(processPromise).rejects.toThrowError(givenError);
    });

    test("readable stream throws error", async () => {
      // GIVEN a stream of data that will throw an error when the stream is read
      const givenData =
        'name,age\n' +
        'John,30\n' +
        'Alice,25\n' +
        'Bob,35\n';

      const stream = Readable.from(givenData);
      const givenError = new Error("some error");
      stream.on('data', () => {
        stream.destroy(givenError);
      });
      // AND a row processor
      const rowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN the stream is processed
      const processPromise = processStream(stream, rowProcessor);

      // THEN expect it to reject with the given error
      await expect(processPromise).rejects.toThrowError(givenError);

    });

    test("csv parser throws error due to invalid data", async () => {
      // GIVEN some invalid data
      const givenData =
        'name,age\n' +
        'John,30, INVALID\n' +
        'Alice,25\n' +
        'Bob,35\n';
      // AND a row processor
      const rowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN the stream is processed
      const processPromise = processStream(Readable.from(givenData), rowProcessor);

      // THEN expect it to reject with the given error
      await expect(processPromise).rejects.toThrowError("Invalid Record Length: columns length is 2, got 3 on line 2");
    });

    test("csv parser throws error due to invalid headers", async () => {
      // GIVEN some data
      const givenData =
        'name,age\n' +
        'John,30\n' +
        'Alice,25\n' +
        'Bob,35\n';
      // AND a row processor
      const rowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        // AND a headers validator that will return false
        validateHeaders: jest.fn().mockResolvedValue(false)
      };

      // WHEN the stream is processed
      const processPromise = processStream(Readable.from(givenData), rowProcessor);

      // THEN expect it to reject with the given error
      await expect(processPromise).rejects.toThrowError("Invalid headers");
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
    const mockResponse = Readable.from(givenData);
    // @ts-ignore
    mockResponse.statusCode = StatusCodes.OK; // Set the status code
    (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
      callback(mockResponse);
      return {
        on: jest.fn(),
      };
    });
    // AND a row processor that returns some stats
    const givenStats = {
      rowsProcessed: 3,
      rowsSuccess: 3,
      rowsFailed: 0
    }

    const rowProcessor: RowProcessor<any> = {
      processRow: jest.fn().mockResolvedValue(undefined),
      completed: jest.fn().mockResolvedValue(givenStats),
      validateHeaders: jest.fn().mockResolvedValue(true)
    };

    // WHEN the file is downloaded and processed
    const actualStats = await processDownloadStream(givenUrl, rowProcessor);

    // THEN expect the stats to be the same as the one returned by the row processor
    expect(actualStats).toEqual(givenStats);
    // AND expect the row processor to have been called with the correct data (header is converted to uppercase)
    expect(rowProcessor.processRow).toHaveBeenNthCalledWith(1, {NAME: 'John', AGE: '30'}, 1);
    expect(rowProcessor.processRow).toHaveBeenNthCalledWith(2, {NAME: 'Alice', AGE: '25'}, 2);
    expect(rowProcessor.processRow).toHaveBeenNthCalledWith(3, {NAME: 'Bob', AGE: '35'}, 3);
  });

  describe("test processDownloadStream with errors", () => {
    test("should reject if the request fails", async () => {
      // GIVEN a url to a csv file
      const givenUrl = 'https://foo/bar.csv';
      // AND a request that fails response with some error
      const givenError = new Error("some error");
      // @ts-ignore
      (https.get as jest.Mock).mockImplementationOnce(() => {
        return { // Return a mock request
          on: jest.fn((event, callback) => {
            callback(givenError);
          }),
        };
      });
      // AND a row processor
      const rowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN the file is downloaded and processed
      const processPromise = processDownloadStream(givenUrl, rowProcessor);

      // THEN expect it to reject with the given error
      await expect(processPromise).rejects.toThrowError(givenError);
    });

    test("should reject if the response status code is not 200", async () => {
      // GIVEN a url to a csv file
      const givenUrl = 'https://foo/bar.csv';
      // AND an empty response with a status code of 404
      const mockResponse = Readable.from("");
      // @ts-ignore
      mockResponse.statusCode = StatusCodes.NOT_FOUND; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(mockResponse);
        return { // Return a mock request
          on: jest.fn(),
        };
      });
      // AND a row processor
      const rowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN the file is downloaded and processed
      const processPromise = processDownloadStream(givenUrl, rowProcessor);

      // THEN expect it to reject with the given error
      await expect(processPromise).rejects.toThrowError("Failed to download file https://foo/bar.csv. Status Code: 404");
    });

    test("should reject if the response is not readable", async () => {
      // GIVEN a url to a csv file
      const givenUrl = 'https://foo/bar.csv';

      // GIVEN a response that will throw an error when the stream is read
      const givenData =
        'name,age\n' +
        'John,30\n' +
        'Alice,25\n' +
        'Bob,35\n';
      const mockResponse = Readable.from(givenData);
      const givenError = new Error("some error");
      mockResponse.on('data', () => {
        mockResponse.destroy(givenError);
      });
      // @ts-ignore
      mockResponse.statusCode = StatusCodes.OK; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(mockResponse);
        return { // Return a mock request
          on: jest.fn(),
        };
      });
      // AND a row processor
      const rowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockResolvedValue(undefined),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN the file is downloaded and processed
      const processPromise = processDownloadStream(givenUrl, rowProcessor);

      // THEN expect it to reject with the given error
      await expect(processPromise).rejects.toThrowError(givenError);
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
      const mockResponse = Readable.from(givenData);
      // @ts-ignore
      mockResponse.statusCode = StatusCodes.OK; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
        };
      });
      // AND a row processor will throw an error
      const givenError = new Error("some error");
      const rowProcessor: RowProcessor<any> = {
        processRow: jest.fn().mockRejectedValue(givenError),
        completed: jest.fn().mockResolvedValue(undefined),
        validateHeaders: jest.fn().mockResolvedValue(true)
      };

      // WHEN the file is downloaded and processed
      const processPromise = processDownloadStream(givenUrl, rowProcessor);

      // THEN expect it to reject with the given error
      await expect(processPromise).rejects.toThrowError(givenError);
    });
  });
});