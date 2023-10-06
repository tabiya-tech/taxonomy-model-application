import Ajv, { SchemaObject } from "ajv";
import addFormats from "ajv-formats";

let ajvInstance: Ajv;

beforeEach(() => {
  ajvInstance = new Ajv({
    validateSchema: true,
    allErrors: true,
    strict: true,
  });
  addFormats(ajvInstance);
});

export const testValidSchema = (
  description: string,
  schema: SchemaObject,
  dependencies: SchemaObject[] = []
) => {
  test(`${description} is a valid Schema`, () => {
    expect(() => {
      dependencies &&
        dependencies.forEach((dependency) => ajvInstance.compile(dependency));
      ajvInstance.compile(schema);
    }).not.toThrowError();
  });
};

export const testSchemaWithValidObject = (
  description: string,
  schema: SchemaObject,
  validObject: object,
  dependencies: SchemaObject[] = []
) => {
  test(`Schema ${description} validates a valid object`, () => {
    ajvInstance.addSchema(schema, schema.$id);
    dependencies &&
      dependencies.forEach((dependency) =>
        ajvInstance.addSchema(dependency, dependency.$id)
      );
    const validateFunction = ajvInstance.getSchema(schema.$id as string);

    if (typeof validateFunction !== "function") {
      throw new Error(
        `Schema with ID ${schema.$id} was not found in AJV instance.`
      );
    }
    // WHEN the object is validated
    const isValid = validateFunction(validObject);

    // THEN expect the object to validate successfully
    expect(isValid).toBe(true);
  });
};

export const testSchemaWithInvalidObject = (
  description: string,
  schema: SchemaObject,
  validObject: object,
  dependencies: SchemaObject[] = []
) => {
  test(`Schema ${description} does not validate object with additional properties`, () => {
    // GIVEN the object has an additional property
    const givenObjectWithAdditionalProperties = { ...validObject, foo: "bar" };

    ajvInstance.addSchema(schema, schema.$id);
    dependencies &&
      dependencies.forEach((dependency) =>
        ajvInstance.addSchema(dependency, dependency.$id)
      );
    const validateFunction = ajvInstance.getSchema(schema.$id as string);

    if (typeof validateFunction !== "function") {
      throw new Error(
        `Schema with ID ${schema.$id} was not found in AJV instance.`
      );
    }

    // WHEN the object is validated
    const isValid = validateFunction(givenObjectWithAdditionalProperties);

    // THEN expect the object to not validate
    expect(isValid).toBe(false);
    expect(validateFunction.errors).not.toBeNull();
  });
};

export const assertValidationErrors = (
  givenObject: unknown,
  givenSchema: SchemaObject,
  failure: Array<unknown>,
  dependencies: SchemaObject[] = []
) => {
  ajvInstance.addSchema(givenSchema, givenSchema.$id);
  dependencies &&
    dependencies.forEach((dependency) =>
      ajvInstance.addSchema(dependency, dependency.$id)
    );
  const validateFunction = ajvInstance.getSchema(givenSchema.$id as string);

  if (typeof validateFunction !== "function") {
    throw new Error(
      `Schema with ID ${givenSchema.$id} was not found in AJV instance.`
    );
  }

  const result = validateFunction(givenObject);
  expect(result).toBeFalsy();
  expect(validateFunction.errors).not.toBeNull();
  expect(validateFunction.errors).toEqual(expect.arrayContaining(failure));
};
