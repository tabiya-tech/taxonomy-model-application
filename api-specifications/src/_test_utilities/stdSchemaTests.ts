import Ajv, { SchemaObject } from "ajv";
import addFormats from "ajv-formats";
import { WHITESPACE } from "./specialCharacters";
import { getMockId } from "./mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "./assertCaseForProperty";

let ajvInstance: Ajv;

beforeEach(() => {
  ajvInstance = new Ajv({
    validateSchema: true,
    allErrors: true,
    strict: true,
  });
  addFormats(ajvInstance);
});

export const testValidSchema = (description: string, schema: SchemaObject, dependencies: SchemaObject[] = []) => {
  test(`${description} is a valid Schema`, () => {
    expect(() => {
      dependencies?.forEach((dependency) => ajvInstance.compile(dependency));
      ajvInstance.compile(schema);
    }).not.toThrowError();
  });
};

export const testSchemaWithValidObject = (
  schemaName: string,
  schema: SchemaObject,
  validObject: object,
  dependencies: SchemaObject[] = []
) => {
  test(`Schema ${schemaName} validates a valid object`, () => {
    ajvInstance.addSchema(schema, schema.$id);
    dependencies?.forEach((dependency) => ajvInstance.addSchema(dependency, dependency.$id));
    const validateFunction = ajvInstance.getSchema(schema.$id as string);

    if (typeof validateFunction !== "function") {
      throw new Error(`Schema with ID ${schema.$id} was not found in AJV instance.`);
    }
    // WHEN the object is validated
    const isValid = validateFunction(validObject);

    // THEN expect the object to validate successfully
    expect(isValid).toBe(true);
    // AND no errors to be present
    expect(validateFunction.errors).toBeNull();
  });
};

export const testSchemaWithAdditionalProperties = (
  description: string,
  schema: SchemaObject,
  validObject: object,
  dependencies: SchemaObject[] = []
) => {
  test(`Schema ${description} does not validate object with additional properties`, () => {
    // GIVEN the object has an additional property
    const givenObjectWithAdditionalProperties = { ...validObject, foo: "bar" };

    ajvInstance.addSchema(schema, schema.$id);
    dependencies?.forEach((dependency) => ajvInstance.addSchema(dependency, dependency.$id));
    const validateFunction = ajvInstance.getSchema(schema.$id as string);

    if (typeof validateFunction !== "function") {
      throw new Error(`Schema with ID ${schema.$id} was not found in AJV instance.`);
    }

    // WHEN the object is validated
    const isValid = validateFunction(givenObjectWithAdditionalProperties);

    // THEN expect the object to not validate
    expect(isValid).toBe(false);
    expect(validateFunction.errors).not.toBeNull();
  });
};

export function testObjectIdField<T>(fieldName: string, givenSchema: SchemaObject) {
  test.each([
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError("", "required", "must have required property 'modelId'"),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be string")],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(`/${fieldName}`, "pattern", 'must match pattern "^[0-9a-f]{24}$"'),
    ],
    [
      CaseType.Failure,
      "random string",
      "foo",
      constructSchemaError(`/${fieldName}`, "pattern", 'must match pattern "^[0-9a-f]{24}$"'),
    ],
    [CaseType.Success, "a valid id", getMockId(1), undefined],
  ])(`(%s) Validate ${fieldName} when it is %s`, (caseType, description, givenValue, failureMessages) => {
    // GIVEN an object with the given value
    //@ts-ignore
    const givenObject: T = {
      [fieldName]: givenValue,
    };
    // THEN expect the object to validate accordingly
    assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, failureMessages);
  });
}