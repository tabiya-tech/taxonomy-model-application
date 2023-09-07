import mongoose from "mongoose";

function formatMessage(message: string, ...args: string[]) {
  return message.replace(/{(\d+)}/g, (match: string, number: number) => {
    return (typeof args[number] != 'undefined'
      ? args[number]
      : match);
  });
}

function assertValidationError<T>(model: mongoose.Model<T>, docSpec: Partial<T>, failedProperty: string, failMessage: string) {
  const newDoc = new model(docSpec);
  const result = newDoc.validateSync();
  expect(result).toBeDefined();
  expect(result?.errors[failedProperty]?.message).toEqual(expect.stringMatching(new RegExp(failMessage)));
}

function assertNoValidationError<T>(model: mongoose.Model<T>, docSpecs: Partial<T>, failedProperty: string) {
  const newDoc = new model(docSpecs);
  const result = newDoc.validateSync();
  if (result) {
    expect(result.errors[failedProperty]).toBeUndefined();
  }
}

export enum CaseType {
  Success = "Success",
  Failure = "Failure",
}

export function assertCaseForProperty<T>(model: mongoose.Model<T>, propertyNames: string|string[], caseType: CaseType, testValue: unknown, expectedFailureMessage?: string) {

  if (typeof propertyNames === "string") {
    propertyNames = [propertyNames];
  }
  // @ts-ignore
  const docSpec: Partial<T> =   createNestedObject(propertyNames, testValue);

  const propertyPath = propertyNames.join(".");

  if (caseType === CaseType.Success) {
    assertNoValidationError<T>(model, docSpec, propertyPath);
  } else {
    expect(expectedFailureMessage).toBeDefined();
    assertValidationError<T>(model, docSpec, propertyPath, formatMessage(expectedFailureMessage as string, propertyPath));
  }
}

/**
 * Assert that the value is stored in the database and returned as expected.
 * This is especially useful for testing values that are transformed by setters and getters.
 * @param model
 * @param propertyNames
 * @param valueToStore
 * @param expectedValue
 */
export async function assertValueStored<T>(model: mongoose.Model<T>, propertyNames: string|string[], valueToStore: unknown, expectedValue: unknown) {
  if (typeof propertyNames === "string") {
    propertyNames = [propertyNames];
  }
  // @ts-ignore
  const docSpec: Partial<T> =   createNestedObject(propertyNames, valueToStore);

  const propertyPath = propertyNames.join(".");

  const newDoc = new model(docSpec);
  await newDoc.save({validateBeforeSave: false});
  expect(newDoc.get(propertyPath)).toEqual(expectedValue);
}

const createNestedObject = (keys: string[], value: unknown): unknown => {
  if (keys.length === 0) {
    return value; // Assign value to innermost property
  }

  const key = keys[0];
  const nestedKeys = keys.slice(1);

  return {
    [key]: createNestedObject(nestedKeys, value) // Recursively build nested object
  };
};