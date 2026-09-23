// mute the console during the test
import "_test_utilities/consoleMock";

import { Readable } from "node:stream";
import https from "https";
import { StatusCodes } from "server/httpUtils";
import { setupMockHTTPS_get, setupMockHTTPS_get_fail } from "_test_utilities/mockHTTPS";
import { readCSVHeaders, readCSVHeadersFromUrl } from "./readCSVHeaders";

jest.mock("https");

describe("test readCSVHeaders", () => {
  test("should return the headers of the first line in uppercase", async () => {
    // GIVEN a CSV stream with a header line and some rows
    const givenData = "id,preferredLabel_EN,PreferredLabel_fr\n1,Cook,Cuisinier\n2,Baker,Boulanger\n";
    const givenStream = Readable.from(givenData);

    // WHEN reading the headers of the stream
    const actualHeaders = await readCSVHeaders(givenStream);

    // THEN expect the headers of the first line in uppercase
    const expectedHeaders = ["ID", "PREFERREDLABEL_EN", "PREFERREDLABEL_FR"];
    expect(actualHeaders).toEqual(expectedHeaders);
    // AND the stream to have been destroyed, since the rest of the file is not needed
    expect(givenStream.destroyed).toBe(true);
  });

  test("should return an empty list when the stream is empty", async () => {
    // GIVEN an empty CSV stream
    const givenStream = Readable.from("");

    // WHEN reading the headers of the stream
    const actualHeaders = await readCSVHeaders(givenStream);

    // THEN expect an empty list
    expect(actualHeaders).toEqual([]);
  });

  test("should reject when the stream is not a valid CSV", async () => {
    // GIVEN a CSV stream whose header line has an unclosed quote
    const givenStream = Readable.from('"ID,PREFERREDLABEL\n');

    // WHEN reading the headers of the stream
    const actualPromise = readCSVHeaders(givenStream);

    // THEN expect it to reject
    await expect(actualPromise).rejects.toThrow();
  });
});

describe("test readCSVHeadersFromUrl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should download and return the headers of the file", async () => {
    // GIVEN a URL to a CSV file
    const givenUrl = "https://foo/bar.csv";
    // AND the file can be downloaded
    const givenData = "ID,PREFERREDLABEL_EN\n1,Cook\n";
    setupMockHTTPS_get(Readable.from(givenData), StatusCodes.OK);

    // WHEN reading the headers of the file
    const actualHeaders = await readCSVHeadersFromUrl(givenUrl);

    // THEN expect the headers of the file
    const expectedHeaders = ["ID", "PREFERREDLABEL_EN"];
    expect(actualHeaders).toEqual(expectedHeaders);
    // AND the file to have been requested from the given URL
    expect(https.get).toHaveBeenCalledWith(givenUrl, expect.any(Object), expect.any(Function));
  });

  test("should reject when the response status code is not 200", async () => {
    // GIVEN a URL to a CSV file
    const givenUrl = "https://foo/bar.csv";
    // AND the file cannot be downloaded
    const givenStatusCode = StatusCodes.NOT_FOUND;
    setupMockHTTPS_get(Readable.from(""), givenStatusCode);

    // WHEN reading the headers of the file
    const actualPromise = readCSVHeadersFromUrl(givenUrl);

    // THEN expect it to reject with an error that names the URL and the status code
    await expect(actualPromise).rejects.toThrow(
      `Failed to download the headers of the file ${givenUrl}. Status Code: ${givenStatusCode}`
    );
  });

  test("should reject when the request fails", async () => {
    // GIVEN a URL to a CSV file
    const givenUrl = "https://foo/bar.csv";
    // AND the request fails
    const givenError = new Error("some error");
    setupMockHTTPS_get_fail(givenError);

    // WHEN reading the headers of the file
    const actualPromise = readCSVHeadersFromUrl(givenUrl);

    // THEN expect it to reject with an error caused by the given error
    await expect(actualPromise).rejects.toThrow(
      expect.toMatchErrorWithCause(`Failed to download the headers of the file ${givenUrl}`, givenError.message)
    );
  });

  test("should reject when the file is not a valid CSV", async () => {
    // GIVEN a URL to a CSV file
    const givenUrl = "https://foo/bar.csv";
    // AND the file is not a valid CSV
    setupMockHTTPS_get(Readable.from('"ID,PREFERREDLABEL\n'), StatusCodes.OK);

    // WHEN reading the headers of the file
    const actualPromise = readCSVHeadersFromUrl(givenUrl);

    // THEN expect it to reject with an error that names the URL
    await expect(actualPromise).rejects.toThrow(`Failed to read the headers of the file ${givenUrl}`);
  });
});
