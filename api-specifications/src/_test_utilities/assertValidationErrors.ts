import {ValidateFunction} from "ajv";

export function assertValidationErrors<T>(validateFunction: ValidateFunction, objectToValidate: Partial<T>, failure: {
  instancePath: string,
  keyword: string,
  message: string
}) {
  const result = validateFunction(objectToValidate);
  expect(result).toBe(false);
  expect(validateFunction.errors).toEqual(expect.arrayContaining(
    [expect.objectContaining({
      instancePath: failure.instancePath,
      keyword: failure.keyword,
      message: failure.message
    })]
  ));
}

export function assertNoValidationErrors<T>(validateFunction: ValidateFunction, objectToValidate: Partial<T>,  instancePath: string) {
  const result = validateFunction(objectToValidate);
  expect(result).toBe(false);
  expect(validateFunction.errors?.find((obj)=>{
    return obj.instancePath === instancePath;
  })).toBeUndefined();
}