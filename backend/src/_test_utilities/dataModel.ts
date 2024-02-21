import mongoose from "mongoose";

function formatMessage(message: string, ...args: string[]) {
  return message.replace(/{(\d+)}/g, (match: string, number: number) => {
    return typeof args[number] != "undefined" ? args[number] : match;
  });
}

function assertValidationError<T>(
  model: mongoose.Model<T>,
  docSpec: Partial<T>,
  failedProperty: string,
  failMessage: string,
  failReason?: string
) {
  const newDoc = new model(docSpec);
  const result = newDoc.validateSync();
  expect(result).toBeDefined();
  expect(result?.errors[failedProperty]?.message).toEqual(expect.stringMatching(new RegExp(failMessage)));
  if (failReason) {
    expect(result?.errors[failedProperty]?.reason?.message).toEqual(expect.stringMatching(new RegExp(failReason)));
  }
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

export function assertCaseForProperty<T>(options: {
  model: mongoose.Model<T>;
  propertyNames: string | string[];
  caseType: CaseType;
  testValue: unknown;
  expectedFailureMessage?: string;
  expectedFailureReason?: string;
  dependencies?: Partial<T>;
}) {
  if (typeof options.propertyNames === "string") {
    options.propertyNames = [options.propertyNames];
  }
  // @ts-ignore
  let docSpec: Partial<T> = createNestedObject(options.propertyNames, options.testValue);

  if (options.dependencies) {
    docSpec = { ...docSpec, ...options.dependencies };
  }

  const propertyPath = options.propertyNames.join(".");

  if (options.caseType === CaseType.Success) {
    assertNoValidationError<T>(options.model, docSpec, propertyPath);
  } else {
    expect(options.expectedFailureMessage).toBeDefined();
    assertValidationError<T>(
      options.model,
      docSpec,
      propertyPath,
      formatMessage(options.expectedFailureMessage as string, propertyPath),
      options.expectedFailureReason
    );
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
export async function assertValueStored<T>(
  model: mongoose.Model<T>,
  propertyNames: string | string[],
  valueToStore: unknown,
  expectedValue: unknown
) {
  if (typeof propertyNames === "string") {
    propertyNames = [propertyNames];
  }
  // @ts-ignore
  const docSpec: Partial<T> = createNestedObject(propertyNames, valueToStore);

  const propertyPath = propertyNames.join(".");

  const newDoc = new model(docSpec);
  await newDoc.save({ validateBeforeSave: false });
  expect(newDoc.get(propertyPath)).toEqual(expectedValue);
}

const createNestedObject = (keys: string[], value: unknown): unknown => {
  if (keys.length === 0) {
    return value; // Assign value to innermost property
  }

  const key = keys[0];
  const nestedKeys = keys.slice(1);

  return {
    [key]: createNestedObject(nestedKeys, value), // Recursively build nested object
  };
};
