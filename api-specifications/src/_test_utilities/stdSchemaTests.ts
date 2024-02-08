import Ajv, { SchemaObject } from "ajv";
import addFormats from "ajv-formats";
import { getTestString, WHITESPACE } from "./specialCharacters";
import {
  assertCaseForProperty,
  assertCaseForRefProperty,
  CaseType,
  constructSchemaError,
} from "./assertCaseForProperty";
import { RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4 } from "../regex";
import { randomUUID } from "crypto";
import {
  getStdEnumTestCases,
  getStdObjectIdTestCases,
  getStdTimestampFieldTestCases,
  getStdURIFieldTestCases,
} from "./stdSchemaTestCases";

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

export const testArraySchemaFailureWithValidObject = (
  schemaName: string,
  schema: SchemaObject,
  validObject: object,
  dependencies: SchemaObject[] = []
) => {
  test(`Schema ${schemaName} fails validation whe it receives a valid object instead of an array`, () => {
    ajvInstance.addSchema(schema, schema.$id);
    dependencies?.forEach((dependency) => ajvInstance.addSchema(dependency, dependency.$id));
    const validateFunction = ajvInstance.getSchema(schema.$id as string);

    if (typeof validateFunction !== "function") {
      throw new Error(`Schema with ID ${schema.$id} was not found in AJV instance.`);
    }
    // WHEN the object is validated
    const isValid = validateFunction(validObject);

    // THEN expect the object to fail validation
    expect(isValid).toBe(false);
    // AND expect an error to be present
    expect(validateFunction.errors).toEqual(
      expect.arrayContaining([expect.objectContaining(constructSchemaError("", "type", "must be array"))])
    );
  });
};

export function testObjectIdField(fieldName: string, givenSchema: SchemaObject, dependencies: SchemaObject[] = []) {
  const fields = fieldName.split("/");
  test.each(getStdObjectIdTestCases(`/${fieldName}`))(
    `(%s) Validate ${fieldName} when it is %s`,
    (caseType, _description, givenValue, failureMessages) => {
      // GIVEN an object with the given value
      const givenObject = generateNestedObject(fields, givenValue);
      // THEN expect the object to validate accordingly
      assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, failureMessages, dependencies);
    }
  );
}

export function testTimestampField<T>(fieldName: string, givenSchema: SchemaObject, dependencies: SchemaObject[] = []) {
  test.each(getStdTimestampFieldTestCases(fieldName))(
    "(%s) Validate 'timestamp' when it is %s",
    (caseType, _description, givenValue, failureMessages) => {
      // GIVEN an object with the given value
      //@ts-ignore
      const givenObject: T = {
        [fieldName]: givenValue,
      };
      // THEN expect the object to validate accordingly
      assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, failureMessages, dependencies);
    }
  );
}

export function testNonEmptyStringField<T>(
  fieldName: string,
  maxLength: number,
  givenSchema: SchemaObject,
  dependencies: SchemaObject[] = []
) {
  test.each([
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError("", "required", `must have required property '${fieldName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be string")],
    [
      CaseType.Failure,
      "empty",
      "",
      constructSchemaError(`/${fieldName}`, "pattern", `must match pattern "${RegExp_Str_NotEmptyString}"`),
    ],
    [
      CaseType.Failure,
      `Too long ${fieldName}`,
      getTestString(maxLength + 1),
      constructSchemaError(`/${fieldName}`, "maxLength", `must NOT have more than ${maxLength} characters`),
    ],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(`/${fieldName}`, "pattern", `must match pattern "${RegExp_Str_NotEmptyString}"`),
    ],
    [CaseType.Success, "a valid string", "foo", undefined],
    [CaseType.Success, "the longest", getTestString(maxLength), undefined],
  ])(`(%s) Validate ${fieldName} when it is %s`, (caseType, _description, givenValue, failureMessages) => {
    // GIVEN an object with the given value
    //@ts-ignore
    const givenObject: T = {
      [fieldName]: givenValue,
    };
    // THEN expect the object to validate accordingly
    assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, failureMessages, dependencies);
  });
}

export function testStringField<T>(
  fieldName: string,
  maxLength: number,
  givenSchema: SchemaObject,
  dependencies: SchemaObject[] = []
) {
  test.each([
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError("", "required", `must have required property '${fieldName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be string")],
    [
      CaseType.Failure,
      `Too long ${fieldName}`,
      getTestString(maxLength + 1),
      constructSchemaError(`/${fieldName}`, "maxLength", `must NOT have more than ${maxLength} characters`),
    ],
    [CaseType.Success, "empty", "", undefined],
    [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
    [CaseType.Success, "one character", "a", undefined],
    [CaseType.Success, "the longest", getTestString(maxLength), undefined],
  ])(`(%s) Validate ${fieldName} when it is %s`, (caseType, _description, givenValue, failureMessages) => {
    // GIVEN an object with the given value
    //@ts-ignore
    const givenObject: T = {
      [fieldName]: givenValue,
    };
    // THEN expect the object to validate accordingly
    assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, failureMessages, dependencies);
  });
}

export function testBooleanField(fieldName: string, givenSchema: SchemaObject, dependencies: SchemaObject[] = []) {
  const fields = fieldName.split("/");
  test.each([
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError(
        (fields.length > 1 ? "/" : "") + fields.slice(0, -1).join("/"),
        "required",
        `must have required property '${fields.slice(-1)}'`
      ),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be boolean")],
    [CaseType.Failure, "not boolean", "foo", constructSchemaError(`/${fieldName}`, "type", "must be boolean")],
    [
      CaseType.Failure,
      "string (true)",
      "true",
      constructSchemaError(`/${fieldName}`, "type", "must be boolean"),
    ],
    [
      CaseType.Failure,
      "string (false)",
      "false",
      constructSchemaError(`/${fieldName}`, "type", "must be boolean"),
    ],
    [CaseType.Success, "true", true, undefined],
    [CaseType.Success, "false", false, undefined],
  ])(`(%s) Validate ${fieldName} when it is %s`, (caseType, _description, givenValue, failureMessages) => {
    // GIVEN an object with the given value
    const givenObject = generateNestedObject(fields, givenValue);

    // THEN expect the object to validate accordingly
    assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, failureMessages, dependencies);
  });
}

export function testUUIDField<T>(fieldName: string, givenSchema: SchemaObject, dependencies: SchemaObject[] = []) {
  test.each([
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError("", "required", `must have required property '${fieldName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be string")],
    [
      CaseType.Failure,
      "empty",
      "",
      constructSchemaError(`/${fieldName}`, "pattern", `must match pattern "${RegExp_Str_UUIDv4}"`),
    ],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(`/${fieldName}`, "pattern", `must match pattern "${RegExp_Str_UUIDv4}"`),
    ],
    [
      CaseType.Failure,
      "not a UUID v4",
      "foo",
      constructSchemaError(`/${fieldName}`, "pattern", `must match pattern "${RegExp_Str_UUIDv4}"`),
    ],
    [CaseType.Success, "Valid UUID", randomUUID(), undefined],
  ])(`(%s) Validate ${fieldName} when it is %s`, (caseType, _description, givenValue, failureMessages) => {
    // GIVEN an object with the given value
    //@ts-ignore
    const givenObject: T = {
      [fieldName]: givenValue,
    };
    // THEN expect the object to validate accordingly
    assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, failureMessages, dependencies);
  });
}

export function testUUIDArray<T>(
  fieldName: string,
  givenSchema: SchemaObject,
  dependencies: SchemaObject[] = [],
  allowEmpty: boolean = true
) {
  test.each([
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError("", "required", `must have required property '${fieldName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be array")],
    [CaseType.Failure, "empty string", "", constructSchemaError(`/${fieldName}`, "type", `must be array`)],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(`/${fieldName}`, "type", "must be array"),
    ],
    [
      CaseType.Failure,
      "an array of non UUID strings",
      ["foo", "bar"],
      constructSchemaError(`/${fieldName}/1`, "pattern", `must match pattern "${RegExp_Str_UUIDv4}"`), // why one
    ],
    [
      CaseType.Failure,
      "mixed array of strings and UUIDs",
      [randomUUID(), "foo"],
      constructSchemaError(`/${fieldName}/1`, "pattern", `must match pattern "${RegExp_Str_UUIDv4}"`),
    ],
    allowEmpty
      ? [CaseType.Success, "empty array", [], undefined]
      : [
          CaseType.Failure,
          "empty array",
          [],
          constructSchemaError(`/${fieldName}`, "minItems", "must NOT have fewer than 1 items"),
        ],
    [CaseType.Success, "an array with a single valid UUID", [randomUUID()], undefined],
    [CaseType.Success, "an array with many valid UUIDs", [randomUUID(), randomUUID(), randomUUID()], undefined],
  ])(`(%s) Validate ${fieldName} when it is %s`, (caseType, _description, givenValue, failureMessages) => {
    // GIVEN an object with the given value
    //@ts-ignore
    const givenObject: T = {
      [fieldName]: givenValue,
    };
    // THEN expect the object to validate accordingly
    assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, failureMessages, dependencies);
  });
}

export function testURIField<T>(
  fieldName: string,
  maxLength: number,
  givenSchema: SchemaObject,
  dependencies: SchemaObject[] = []
) {
  test.each(getStdURIFieldTestCases(fieldName, maxLength))(
    `(%s) Validate ${fieldName} when it is %s`,
    (caseType, _description, givenValue, failureMessages) => {
      // GIVEN an object with the given value
      //@ts-ignore
      const givenObject: T = {
        [fieldName]: givenValue,
      };
      // THEN expect the object to validate accordingly
      assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, failureMessages, dependencies);
    }
  );
}

export function testRefSchemaField(
  fieldName: string,
  givenSchema: SchemaObject,
  validObject: object | Array<object>,
  refSchema: SchemaObject,
  dependencies: SchemaObject[] = []
) {
  test.each([
    [CaseType.Failure, "undefined", undefined],
    [CaseType.Failure, "null", null],
    [CaseType.Failure, "not the expected shape", { foo: "bar" }],
    [CaseType.Success, "a valid object", validObject],
  ])(`(%s) Validate ${fieldName} when it is %s`, (caseType, _description, givenValue) => {
    const givenObject = {
      [fieldName]: givenValue,
    };
    assertCaseForRefProperty(fieldName, givenObject, givenSchema, caseType, refSchema, dependencies);
  });
}

export function testEnumField(
  fieldName: string,
  givenSchema: SchemaObject,
  validEnum: string[],
  dependencies: SchemaObject[] = []
) {
  const fields = fieldName.split("/");
  test.each(getStdEnumTestCases(fieldName, validEnum))(
    `(%s) Validate ${fieldName} when it is %s`,
    (caseType: CaseType, _description, givenValue, expectedFailures) => {
      const givenObject = generateNestedObject(fields, givenValue);
      // @ts-ignore
      assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, expectedFailures, dependencies);
    }
  );
}

function generateNestedObject(fields: string[], value: unknown) {
  if (fields.length === 0) {
    return value;
  }
  const newObj = {};
  //@ts-ignore
  newObj[fields[0]] = generateNestedObject(fields.slice(1), value);
  return newObj;
}
