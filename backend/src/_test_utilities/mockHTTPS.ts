import https from "https";
import { StatusCodes } from "server/httpUtils";
import { Readable } from "node:stream";
import { EventEmitter } from "events";

/**
 * Sets up a mock for https.get that simulates a successful response.
 * @param givenResponse
 * @param givenStatusCode
 */
export function setupMockHTTPS_get(givenResponse: Readable, givenStatusCode: StatusCodes) {
  // @ts-ignore
  givenResponse.statusCode = givenStatusCode; // Set the status code
  (https.get as jest.Mock).mockImplementationOnce((_url, _options, callback) => {
    // it is important to use process.nextTick to simulate async behavior
    // otherwise the error will be thrown immediately when the on() method is called
    process.nextTick(() => callback(givenResponse));
    return {
      // Return a mock request
      on: jest.fn(),
    };
  });
}

/**
 * Sets up a mock for https.get that simulates a failure by emitting an error.
 * @param givenError
 */
export function setupMockHTTPS_get_fail(givenError: Error) {
  (https.get as jest.Mock).mockImplementationOnce(() => {
    // @ts-ignore
    const req = new EventEmitter() as unknown as https.ClientRequest;
    req.end = jest.fn();
    process.nextTick(() => req.emit("error", givenError)); // simulate async failure
    return req;
  });
}

/**
 * Sets up a mock for https.request that simulates a successful response.
 * @param givenResponse - The readable stream to return as the response.
 * @param givenStatusCode - The status code to set on the response.
 */
export function setupMockHTTPS_request(givenResponse: Readable, givenStatusCode: StatusCodes) {
  // @ts-ignore
  givenResponse.statusCode = givenStatusCode; // Set the status code
  (https.request as jest.Mock).mockImplementationOnce((_url, _options, callback) => {
    // it is important to use process.nextTick to simulate async behavior
    // otherwise the error will be thrown immediately when the on() method is called
    process.nextTick(() => callback(givenResponse));
    return {
      // Return a mock request
      on: jest.fn(),
      end: jest.fn(), // Mock the end method to prevent errors
    };
  });
}

/**
 * Sets up a mock for https.request that simulates a failure by emitting an error.
 * @param givenError
 */
export function setupMockHTTPS_request_fail(givenError: Error) {
  (https.request as jest.Mock).mockImplementationOnce(() => {
    // @ts-ignore
    const req = new EventEmitter() as unknown as https.ClientRequest;
    req.end = jest.fn();
    // it is important to use process.nextTick to simulate async behavior
    // otherwise the error will be thrown immediately when the on() method is called
    process.nextTick(() => req.emit("error", givenError)); // simulate async failure
    return req;
  });
}
