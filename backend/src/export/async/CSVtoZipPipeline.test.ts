// Silence chatty console
import "_test_utilities/consoleMock";

import CSVtoZipPipeline from "./CSVtoZipPipeline";
import archiver from "archiver";
import { Readable } from "node:stream";
import errorLogger from "common/errorLogger/errorLogger";

jest.mock("archiver", () => {
  return jest.fn(() => ({
    append: jest.fn().mockReturnValue({
      on: jest.fn(),
    }),
  }));
});

jest.spyOn(errorLogger, "logError");

describe("CSVtoZipPipeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("should append data to zipper correctly", async () => {
    // GIVEN a valid  zipper, notifyOnError, csvFileName and pipelineName
    const givenZipper = archiver("zip", { zlib: { level: 9 } });
    const givenCSVFileName = "test.csv";
    const givenPipelineName = "testPipeline";

    // AND a csvStream that will emit data
    const mockData = ["item1", "item2", "item3"];
    const givenCsvStream = Readable.from(mockData);

    // WHEN CSVtoZipPipeline is called with the given parameters
    let actualPipeline = undefined;
    await new Promise<void>((resolve, reject) => {
      actualPipeline = CSVtoZipPipeline(givenPipelineName, givenCSVFileName, givenCsvStream, givenZipper, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // THEN expect the append function of the zipper to have been called with the correct parameters
    expect(givenZipper.append).toHaveBeenCalledWith(actualPipeline, { name: givenCSVFileName });
    // AND the success message to be displayed
    expect(console.info).toHaveBeenCalledWith(
      `Zipping CSV file ${givenCSVFileName} succeeded. ${mockData.length} objects processed.`
    );
  });

  test("should call notifyOnError when csvStream emits an error", async () => {
    // GIVEN  a valid  zipper, notifyOnError, csvFileName and pipelineName
    const givenZipper = archiver("zip", { zlib: { level: 9 } });
    const givenCSVFileName = "test.csv";
    const givenPipelineName = "testPipeline";
    // AND a CSV Stream that will emit an error
    const givenError = new Error("csvStream error");
    const givenCSVStream = new Readable({
      read() {
        this.emit("error", givenError);
      },
    });

    // WHEN CSVtoZipPipeline is called with the given parameters
    const actualPromise = new Promise<void>((resolve, reject) =>
      CSVtoZipPipeline(givenPipelineName, givenCSVFileName, givenCSVStream, givenZipper, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      })
    );

    // THEN the notifyOnClose is triggered with an error
    await expect(actualPromise).rejects.toThrowError(
      `An error occurred while reading the ${givenPipelineName} CSV data.`
    );
    // AND the error to be logged
    expect(errorLogger.logError).toHaveBeenCalledWith(expect.any(Error), givenError);
  });
});
