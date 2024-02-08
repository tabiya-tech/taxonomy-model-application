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
  const { result, validateFunction } = validate(givenObject, givenSchema, dependencies);

  if (caseType === CaseType.Success) {
    assertNoValidationError(propertyPath, validateFunction);
  } else {
    expect(expectedFailures).toBeDefined();
    assertValidationErrors(result, validateFunction, expectedFailures!); // expected failures cannot be undefined when we are asserting an error case
  }
};

/*
  Designed to do basic checks for ref fields in a schema.
  Checks done by this function are limited to missing field,
  null field and missing required properties inside an object field.
 */
export const assertCaseForRefProperty = (
  field: string,
  givenObject: unknown,
  givenSchema: SchemaObject,
  caseType: CaseType,
  refSchema: SchemaObject,
  dependencies: SchemaObject[] = []
) => {
  const { result, validateFunction } = validate(givenObject, givenSchema, dependencies, refSchema);

  // Determine if the reference field is expected to be an object based on the refSchema
  const isRefObject = refSchema.type === "object";

  const expectedFailures: SchemaError[] = [];

  const validateObjectRequiredFields = () => {
    // First, get a list of properties that are actually required according to the refSchema
    const requiredProperties = refSchema.required || [];

    // Filter out properties that are not required
    const propertiesToValidate = Object.keys(refSchema.properties).filter((property) =>
      requiredProperties.includes(property)
    );

    propertiesToValidate.forEach((property) => {
      // @ts-ignore
      if (!(property in givenObject[field])) {
        expectedFailures.push(
          constructSchemaError("/" + field, "required", `must have required property '${property}'`)
        );
      }
    });
  };

  if (caseType === CaseType.Success) {
    assertNoValidationError(field, validateFunction);
  } else {
    // first we simply check if the field is missing or null
    // and add the expected error if it is
    // @ts-ignore
    if (givenObject[field] === undefined) {
      // If the field being tested is undefined on the given object then add a "property required" error
      expectedFailures.push(constructSchemaError("", "required", `must have required property '${field}'`));
    }
    // @ts-ignore
    else if (givenObject[field] === null) {
      // If the field being tested is null on the given object then add a "type must be
      expectedFailures.push(constructSchemaError("/" + field, "type", `must be object`));
    } else if (isRefObject) {
      // if the ref is an object then we check that each of the
      // required properties are not missing
      validateObjectRequiredFields();
    }

    expect(expectedFailures).toBeDefined();
    expect(expectedFailures).not.toHaveLength(0); // we expect that a failure will occur
    assertValidationErrors(result, validateFunction, expectedFailures);
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
  /* asserting that no validation errors exist for a property requires four checks:
      1. The property path is not present in the errors
      2. The parent path is not present in the errors with the message: "must have required property 'PROPERTY_NAME'"
         ,where PROPERTY_NAME is the name of the property. This is the error message that is returned when a required property is missing
      3 The parent path is not present in the errors with the message: "must be array".
      This is the error message that is returned when a property is expected to be an array
      4. There is no error regarding an additional property with the same name as the property we are asserting.
         This case is needed to exclude a false positive when the propertyPath is misspelled
    */

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
          error.message?.includes(`must have required property '${propertyName}'`)) ||
        (error.instancePath === canonicalParentPath && error.message?.includes(`must be array`))
    ) ?? false;

  // check that there is no error regarding an additional property with the same name as the property we are asserting as explained above in 3.
  const hasAdditionalPropertyError = validateFunction.errors?.some(
    (error) => error.keyword === "additionalProperties" && error.params.additionalProperty === propertyName
  );

  expect(!hasErroredOrMissingProperty && !hasAdditionalPropertyError).toBe(true);
};

/*
 utility function for setting up ajv by adding the required schemas and
 then running the JSONSchema validation function from ajv
 */
const validate = (
  givenObject: unknown,
  givenSchema: SchemaObject,
  dependencies: SchemaObject[],
  refSchema?: SchemaObject
): {
  result: boolean;
  validateFunction: ValidateFunction;
} => {
  // add the schema and dependencies to the ajv instance, if they are not already present
  if (!ajvInstance.getSchema(givenSchema.$id as string)) {
    ajvInstance.addSchema(givenSchema, givenSchema.$id);
  }
  // add the ref schema to the ajv instance if it exists and is not already present
  if (refSchema && !ajvInstance.getSchema(refSchema.$id as string)) {
    ajvInstance.addSchema(refSchema, refSchema.$id);
  }
  dependencies.forEach((dependency) =>
    ajvInstance.getSchema(dependency.$id as string) ? null : ajvInstance.addSchema(dependency, dependency.$id)
  );

  // currently, we support only synchronous validation
  const validateFunction: ValidateFunction = ajvInstance.getSchema(givenSchema.$id as string) as ValidateFunction;

  const result = validateFunction(givenObject);

  return { result, validateFunction };
};

/*
utility function for constructing schema error objects that can be used to validate specific failures during field validation testing
 */
export const constructSchemaError = (instancePath: string, keyword: string, message: string): SchemaError => {
  return {
    instancePath: instancePath,
    keyword: keyword,
    message: message,
  };
};
