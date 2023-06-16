// mute the console during the test
import "_test_utilities/consoleMock"

import {processDownloadStream, processStream} from "./processStream";
import {Readable} from "node:stream";
import https from 'https';
import {StatusCodes} from "server/httpUtils";

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

    // AND validator which resolves
    const mockHeadersValidator = jest.fn().mockResolvedValue(true);
    // AND a row processor
    const processRow = jest.fn();
    // ABD a completed processor
    const completedProcessor = jest.fn();

    // WHEN the stream is processed
    await processStream(stream, mockHeadersValidator, processRow, completedProcessor);

    // THEN expect the headersValidator to have been called once
    expect(mockHeadersValidator).toHaveBeenCalledTimes(1);
    // AND expect the headersValidator to have been called with the correct headers
    expect(mockHeadersValidator).toHaveBeenCalledWith(['NAME', 'AGE']);
    // AND expect the row processor to have been called 3 times
    expect(processRow).toHaveBeenCalledTimes(3);
    // AND expect the row processor to have been called with the correct data (header is converted to uppercase)
    expect(processRow).toHaveBeenNthCalledWith(1, {NAME: 'John', AGE: '30'}, 1);
    expect(processRow).toHaveBeenNthCalledWith(2, {NAME: 'Alice', AGE: '25'}, 2);
    expect(processRow).toHaveBeenNthCalledWith(3, {NAME: 'Bob', AGE: '35'}, 3);
    // AND expect the completed processor to have been called once
    expect(completedProcessor).toHaveBeenCalledTimes(1);
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

      // AND validator which resolves
      const mockHeadersValidator = jest.fn().mockResolvedValue(undefined);
      // AND a row processor that will throw an error
      const givenError = new Error("some error");
      const processRow = jest.fn().mockRejectedValue(givenError);
      // AND a completed processor which resolves
      const completedProcessor = jest.fn().mockResolvedValue(undefined);

      // WHEN the stream is processed
      const processPromise = processStream(stream, mockHeadersValidator, processRow, completedProcessor);

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

      // AND validator which resolves
      const mockHeadersValidator = jest.fn().mockResolvedValue(undefined);
      // AND a row processor which resolves
      const processRow = jest.fn().mockResolvedValue(undefined);
      // AND a completed processor which resolves
      const completedProcessor = jest.fn().mockResolvedValue(undefined);

      // WHEN the stream is processed
      const processPromise = processStream(stream, mockHeadersValidator, processRow, completedProcessor);

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

      // AND validator which resolves
      const mockHeadersValidator = jest.fn().mockResolvedValue(undefined);
      // AND a row processor which resolves
      const processRow = jest.fn().mockResolvedValue(undefined);
      // AND a completed processor which resolves
      const completedProcessor = jest.fn().mockResolvedValue(undefined);

      // WHEN the stream is processed
      const processPromise = processStream(Readable.from(givenData), mockHeadersValidator, processRow, completedProcessor);

      // THEN expect it to reject with the given error
      await expect(processPromise).rejects.toThrowError("Invalid Record Length: columns length is 2, got 3 on line 2");
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

    // AND validator which resolves
    const mockHeadersValidator = jest.fn().mockResolvedValue(undefined);
    // AND a row processor which resolves
    const processRow = jest.fn().mockResolvedValue(undefined);
    // AND a completed processor which resolves
    const completedProcessor = jest.fn().mockResolvedValue(undefined);

    // WHEN the file is downloaded and processed
    await processDownloadStream(givenUrl, mockHeadersValidator, processRow, completedProcessor);

    // THEN expect the row processor to have been called 3 times
    expect(processRow).toHaveBeenCalledTimes(3);
    // AND expect the row processor to have been called with the correct data (header is converted to uppercase)
    expect(processRow).toHaveBeenNthCalledWith(1, {NAME: 'John', AGE: '30'}, 1);
    expect(processRow).toHaveBeenNthCalledWith(2, {NAME: 'Alice', AGE: '25'}, 2);
    expect(processRow).toHaveBeenNthCalledWith(3, {NAME: 'Bob', AGE: '35'}, 3);
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

      // AND validator which resolves
      const mockHeadersValidator = jest.fn().mockResolvedValue(undefined);
      // AND a row processor which resolves
      const processRow = jest.fn().mockResolvedValue(undefined);
      // AND a completed processor which resolves
      const completedProcessor = jest.fn().mockResolvedValue(undefined);

      // WHEN the file is downloaded and processed
      const processPromise = processDownloadStream(givenUrl, mockHeadersValidator, processRow, completedProcessor);

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

      // AND validator which resolves
      const mockHeadersValidator = jest.fn().mockResolvedValue(undefined);
      // AND a row processor which resolves
      const processRow = jest.fn().mockResolvedValue(undefined);
      // AND a completed processor which resolves
      const completedProcessor = jest.fn().mockResolvedValue(undefined);

      // WHEN the file is downloaded and processed
      const processPromise = processDownloadStream(givenUrl, mockHeadersValidator, processRow, completedProcessor);

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

      // AND validator which resolves
      const mockHeadersValidator = jest.fn().mockResolvedValue(undefined);
      // AND a row processor which resolves
      const processRow = jest.fn().mockResolvedValue(undefined);
      // AND a completed processor which resolves
      const completedProcessor = jest.fn().mockResolvedValue(undefined);

      // WHEN the file is downloaded and processed
      const processPromise = processDownloadStream(givenUrl, mockHeadersValidator, processRow, completedProcessor);

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

      // AND validator which resolves
      const mockHeadersValidator = jest.fn().mockResolvedValue(undefined);
      // AND a row processor that will throw an error
      const givenError = new Error("some error");
      const processRow = jest.fn().mockRejectedValue(givenError);
      // AND a completed processor which resolves
      const completedProcessor = jest.fn().mockResolvedValue(undefined);

      // WHEN the file is downloaded and processed
      const processPromise = processDownloadStream(givenUrl, mockHeadersValidator, processRow, completedProcessor);

      // THEN expect it to reject with the given error
      await expect(processPromise).rejects.toThrowError(givenError);
    });
  });
});