//mute chatty console
import "_test_utilities/consoleMock";

import { handleInsertManyError } from "./handleInsertManyErrors";

import mongoose, { mongo } from "mongoose";

function getMockDocument() {
  const id = new mongoose.Types.ObjectId();
  return {
    id,
    populate: jest.fn(),
    toObject: jest.fn().mockReturnValue({ id }),
  };
}

describe("handleInsertManyError", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should handle MongoBulkWriteError with multiple populations", async () => {
    // GIVEN a MongoBulkWriteError with N inserted documents
    const givenInsertedDocuments = Array.from({ length: 3 }, () => getMockDocument());
    const givenError = new mongoose.mongo.MongoBulkWriteError(new Error("Some error"), {} as mongo.BulkWriteResult);
    givenError.insertedDocs = givenInsertedDocuments;
    // AND some populate options
    const givenPopulateOptions: mongoose.PopulateOptions[] = [{ path: "populatedField1" }, { path: "populatedField2" }];
    // AND some expected caller info
    const givenCallerInfo = "someCallerInfo";
    // AND some expected count
    const givenExpectedCount = 10;

    // WHEN handleInsertManyError is called with the given error, callerInfo, expected count and populate options
    const actualResult: { name: string }[] = await handleInsertManyError(
      givenError,
      givenCallerInfo,
      givenExpectedCount,
      givenPopulateOptions
    );

    // THEN it should return the inserted document transformed by toObject()
    expect(actualResult).toHaveLength(givenInsertedDocuments.length);
    expect(actualResult).toEqual(expect.arrayContaining(givenInsertedDocuments.map((doc) => doc.toObject())));

    // AND it should have called the populate() method of each documents with the given populate options before calling toObject()
    for (const mockDoc of givenInsertedDocuments) {
      expect(mockDoc.populate).toHaveBeenCalledWith(givenPopulateOptions);
      expect(mockDoc.populate).toHaveBeenCalledBefore(mockDoc.toObject);
    }

    // AND it should have logged a warning
    expect(console.warn).toHaveBeenCalledWith(
      `${givenCallerInfo}: ${givenInsertedDocuments.length} out of ${givenExpectedCount} documents were inserted successfully.`
    );
  });

  test("should handle MongoBulkWriteError without population", async () => {
    // GIVEN a MongoBulkWriteError with N inserted document
    const givenInsertedDocuments = Array.from({ length: 3 }, () => getMockDocument());
    const givenError = new mongoose.mongo.MongoBulkWriteError(new Error("Some error"), {} as mongo.BulkWriteResult);
    givenError.insertedDocs = givenInsertedDocuments;
    // AND some expected caller info
    const givenCallerInfo = "someCallerInfo";
    // AND some expected count
    const givenExpectedCount = 10;
    // WHEN handleInsertManyError is called with the given error, callerInfo, expected count
    const actualResult: { name: string }[] = await handleInsertManyError(
      givenError,
      givenCallerInfo,
      givenExpectedCount
    );

    // THEN it should return the inserted document transformed by toObject()
    expect(actualResult).toHaveLength(givenInsertedDocuments.length);
    expect(actualResult).toEqual(expect.arrayContaining(givenInsertedDocuments.map((doc) => doc.toObject())));

    // AND it should have called the populate() method of each documents with the given populate options before calling toObject()
    for (const mockDoc of givenInsertedDocuments) {
      expect(mockDoc.populate).not.toHaveBeenCalled();
    }

    // AND it should have logged a warning
    expect(console.warn).toHaveBeenCalledWith(
      `${givenCallerInfo}: ${givenInsertedDocuments.length} out of ${givenExpectedCount} documents were inserted successfully.`
    );
  });

  test("should throw error for non-bulk write errors", async () => {
    // GIVEN a non-bulk write error
    const givenError = new Error("Some error");
    // AND some expected caller info
    const givenCallerInfo = "someCallerInfo";
    // AND some expected count
    const givenExpectedCount = 10;
    // WHEN handleInsertManyError is called with the error
    const actualPromise = handleInsertManyError(givenError, givenCallerInfo, givenExpectedCount);

    // THEN it should throw the error
    await expect(actualPromise).rejects.toThrow(givenError);
    // AND it should have logged a warning
    expect(console.error).toHaveBeenCalledWith(
      `${givenCallerInfo}: none of the ${givenExpectedCount} documents were inserted.`,
      givenError
    );
  });
});
