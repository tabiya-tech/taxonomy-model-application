/* eslint-disable @typescript-eslint/no-empty-function */
export {};
// Suppress chatty console during the tests
jest.spyOn(console, "error").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "info").mockImplementation(() => {});
