import {WHITESPACE} from "./specialCharacters";
import {IModelInfoResponse} from "../modelInfo";
import {assertNoValidationErrors, assertValidationErrors} from "./assertValidationErrors";
import {ValidateFunction} from "ajv";

/**
 * Tests if the property 'createdAt' or 'updatedAt' of a schema is defined correctly.
 * It runs a set of negative tests.
 * @param propertyName The name of the property to test
 * @param validateFunction The validate function for the schema to test. Use ajv.compile(schema), or any other equivalent way, to get it,
 */
export function testExpectedFailValuesForSchemaProperty_DateTime<T>(propertyName: "createdAt" | "updatedAt", validateFunction: ValidateFunction) {
  const propertyPath = `/${propertyName}`
  return describe(`Fail validation '${propertyPath}'`, () => {
    test.each([
      ["undefined", undefined, {
        instancePath: "",
        keyword: "required",
        message: `must have required property '${propertyName}'`
      }],
      ["null", null, {instancePath: propertyPath, keyword: "type", message: "must be string"}],
      ["empty", "", {
        instancePath: propertyPath,
        keyword: "format",
        message: 'must match format "date-time"'
      }],
      ["only whitespace characters", WHITESPACE, {
        instancePath: propertyPath,
        keyword: "format",
        message: 'must match format "date-time"'
      }],
      ["not ISO date", "13-11-2018T20:20:39+00:00", {
        instancePath: propertyPath,
        keyword: "format",
        message: 'must match format "date-time"'
      }],
    ])
    (`Fail validation ${propertyPath} because it is %s`, (caseDescription, value, failure) => {
      const spec: Partial<T> = {};
      // @ts-ignore
      spec[propertyName] = value;
      assertValidationErrors<T>(validateFunction, spec, failure);
    });
  });
}

export function testExpectedSuccessfulValuesForSchemaProperty_DateTime<T>(propertyName: "createdAt" | "updatedAt", validateFunction: ValidateFunction) {
  const propertyPath = `/${propertyName}`
  return describe(`Successful validation '${propertyPath}'`, () => {
    test.each([
      ["ISO date with timezone", "2023-05-15T09:14:49.576+00:00", propertyPath],
      ["ISO date Z", "2023-05-15T09:14:49Z", propertyPath],
      ["ISO date", "2023-05-15T09:14:49", propertyPath],
    ])
    (`Successful validation ${propertyPath} when %s`, (caseDescription, value, propertyPath) => {
      const spec: Partial<T> = {};
      // @ts-ignore
      spec[propertyName] = value;
      assertNoValidationErrors<T>(validateFunction, spec, propertyPath);
    });
  });
};