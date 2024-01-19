//mute chatty console
import "_test_utilities/consoleMock";

import { handleInsertManyError } from "./handleInsertManyErrors";

import mongoose, { mongo } from "mongoose";

function getMockDocument() {
  return {
    id: new mongoose.Types.ObjectId(),
  };
}

describe("handleInsertManyError", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should handle MongoBulkWriteError with multiple objects", async () => {
    // GIVEN a MongoBulkWriteError with N inserted documents
    const givenInsertedDocuments = Array.from({ length: 3 }, () => getMockDocument());
    const givenError = new mongoose.mongo.MongoBulkWriteError(new Error("Some error"), {} as mongo.BulkWriteResult);
    givenError.insertedDocs = givenInsertedDocuments;

    // AND some expected caller info
    const givenCallerInfo = "someCallerInfo";
    // AND some expected count
    const givenExpectedCount = 10;

    // WHEN handleInsertManyError is called with the given error, callerInfo and expected count
    const actualResult = handleInsertManyError(givenError, givenCallerInfo, givenExpectedCount);

    // THEN it should return the inserted document transformed by toObject()
    expect(actualResult).toHaveLength(givenInsertedDocuments.length);
    expect(actualResult).toEqual(givenInsertedDocuments);
  });

  test("should throw error for non-bulk write errors", async () => {
    // GIVEN a non-bulk write error
    const givenError = new Error("Some error");
    // AND some expected caller info
    const givenCallerInfo = "someCallerInfo";
    // AND some expected count
    const givenExpectedCount = 10;

    // WHEN handleInsertManyError is called with the error
    const callHandleInsertManyError = () => handleInsertManyError(givenError, givenCallerInfo, givenExpectedCount);

    // THEN it should throw the error
    expect(callHandleInsertManyError).toThrow(
      expect.toMatchErrorWithCause(
        `${givenCallerInfo}: none of the ${givenExpectedCount} documents were inserted.`,
        givenError.message
      )
    );
    // AND it should have logged a warning
    expect(console.error).toHaveBeenCalledWith(
      expect.toMatchErrorWithCause(
        `${givenCallerInfo}: none of the ${givenExpectedCount} documents were inserted.`,
        givenError.message
      )
    );
  });
});
