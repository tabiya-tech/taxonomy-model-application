import Ajv, { SchemaObject, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

export type SchemaError = {
  instancePath: string;
  keyword: string;
  message: string;
};

export enum CaseType {
  Success = "Success",
  Failure = "Failure",
}

// set up the ajv instance
const ajvInstance: Ajv = new Ajv({
  validateSchema: true,
  allErrors: true,
  strict: true,
});
addFormats(ajvInstance);
// ---

/**
 *
 * @param propertyPath The path of the property to assert the case for. e.g. /foo or foo, /foo/bar or foo/bar
 * @param givenObject The object to validate
 * @param givenSchema The schema to validate against
 * @param caseType The case to assert
 * @param expectedFailures The expected expectedFailures. The assertion will fail if any of expected failures are not present in the validation errors
 * @param dependencies The dependencies of the schema
 */
export const assertCaseForProperty = (
  propertyPath: string,
  givenObject: unknown,
  givenSchema: SchemaObject,
  caseType: CaseType,
  expectedFailures: SchemaError | SchemaError[] | undefined,
  dependencies: SchemaObject[] = []
) => {
  // add the schema and dependencies to the ajv instance, if they are not already present
  if (!ajvInstance.getSchema(givenSchema.$id as string)) {
    ajvInstance.addSchema(givenSchema, givenSchema.$id);
  }
  dependencies.forEach((dependency) =>
    ajvInstance.getSchema(dependency.$id as string) ? null : ajvInstance.addSchema(dependency, dependency.$id)
  );

  // currently, we support only synchronous validation
  const validateFunction: ValidateFunction = ajvInstance.getSchema(givenSchema.$id as string) as ValidateFunction;

  if (typeof validateFunction !== "function") {
    throw new Error(`Schema with ID ${givenSchema.$id} was not found in AJV instance.`);
  }

  const result = validateFunction(givenObject);

  if (caseType === CaseType.Success) {
    assertNoValidationError(propertyPath, validateFunction);
  } else {
    expect(expectedFailures).toBeDefined();
    assertValidationErrors(result, validateFunction, expectedFailures!); // expected failures cannot be undefined when we are asserting an error case
  }
};

const assertValidationErrors = (
  result: boolean,
  validateFunction: ValidateFunction,
  expectedFailures: SchemaError | SchemaError[]
) => {
  expect(result).toBe(false);
  expect(validateFunction.errors).not.toBeNull();
  if (Array.isArray(expectedFailures)) {
    expect(expectedFailures.length).toBeGreaterThan(0);
    // expect that all failures are contained in objects that are part of the errors
    expectedFailures.forEach((expectedFailure) => {
      expect(validateFunction.errors).toEqual(expect.arrayContaining([expect.objectContaining(expectedFailure)]));
    });
  } else {
    // expect that the failure is contained in an object that is part of the errors
    expect(validateFunction.errors).toEqual(expect.arrayContaining([expect.objectContaining(expectedFailures)]));
  }
};
const assertNoValidationError = (propertyPath: string, validateFunction: ValidateFunction) => {
  // asserting that no validation errors exist for a property requires two checks:
  // 1. The property path is not present in the errors
  // 2. The parent path is not present in the errors with the message: "must have required property 'PROPERTY_NAME'"
  //    , where PROPERTY_NAME is the name of the property. This is the error message that is returned when a required property is missing
  // 3. There is no error regarding an additional property with the same name as the property we are asserting.
  //    This case is needed to exclude a false positive when the propertyPath is misspelled

  // first ensure that the property path has a canonical format
  const canonicalPropertyPath = propertyPath.startsWith("/") ? propertyPath : "/" + propertyPath;
  // extract the property name and the parent path
  const propertyName = canonicalPropertyPath.substring(
    canonicalPropertyPath.lastIndexOf("/") + 1,
    canonicalPropertyPath.length
  );
  const canonicalParentPath = canonicalPropertyPath.substring(0, canonicalPropertyPath.lastIndexOf("/"));

  // check that no errors are present as explained above in 1. and 2, or there is no error at all
  const hasErroredOrMissingProperty =
    validateFunction.errors?.some(
      (error) =>
        error.instancePath === canonicalPropertyPath ||
        (error.instancePath === canonicalParentPath &&
          error.message?.includes(`must have required property '${propertyName}'`))
    ) ?? false;

  // check that there is no error regarding an additional property with the same name as the property we are asserting as explained above in 3.
  const hasAdditionalPropertyError = validateFunction.errors?.some(
    (error) => error.keyword === "additionalProperties" && error.params.additionalProperty === propertyName
  );

  expect(!hasErroredOrMissingProperty && !hasAdditionalPropertyError).toBe(true);
};
export const constructSchemaError = (instancePath: string, keyword: string, message: string): SchemaError => {
  return {
    instancePath: instancePath,
    keyword: keyword,
    message: message,
  };
};
