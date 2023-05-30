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

export function assertCaseForProperty<T>(model: mongoose.Model<T>, propertyName: string, caseType: CaseType, testValue: unknown, expectedFailureMessage?: string) {
  // @ts-ignore
  const docSpec: Partial<T> = {
    // @ts-ignore
    [propertyName]: testValue
  };
  if (caseType === CaseType.Success) {
    assertNoValidationError<T>(model, docSpec, propertyName);
  } else {
    expect(expectedFailureMessage).toBeDefined();
    assertValidationError<T>(model, docSpec, propertyName, formatMessage(expectedFailureMessage as string, propertyName));
  }
}