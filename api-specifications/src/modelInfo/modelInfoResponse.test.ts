import Ajv, {ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import {IModelInfoResponse, ModelInfoResponseSchema} from "./modelInfoResponse";
import {ModelInfoRequestSchema} from "./modelInfoRequest";
import {LocaleSchema} from "./locale";
import {getTestString, WHITESPACE} from "../_test_utilities/specialCharacters";
import {
  LOCALE_SHORTCODE_MAX_LENGTH,
  NAME_MAX_LENGTH, PATH_MAX_LENGTH,
  RELEASE_NOTES_MAX_LENGTH,
  VERSION_MAX_LENGTH
} from "./modelInfo.constants";
import {randomUUID} from "crypto";
import {RegExp_Str_ID, RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4} from "../regex";
import {getMockId} from "../_test_utilities/mockMongoId";
import {assertValidationErrors} from "../_test_utilities/assertValidationErrors";
import {
  testExpectedFailValuesForSchemaProperty_DateTime, testExpectedSuccessfulValuesForSchemaProperty_DateTime
} from "../_test_utilities/date-time-propertyTest";

describe('Test the ModelInfoResponse Schema', () => {
  test("The ModelInfoRequestSchema module can be required via the index", () => {
    expect(() => {
      expect(require("modelInfo/index").ModelInfoResponseSchema).toBeDefined();
    }).not.toThrowError();
  })

  test("The ModelInfoResponse schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(ModelInfoRequestSchema, ModelInfoRequestSchema.$id);
      ajv.addSchema(LocaleSchema, LocaleSchema.$id);
      ajv.addSchema(ModelInfoResponseSchema, ModelInfoResponseSchema.$id);
      ajv.getSchema(ModelInfoResponseSchema.$id as string);
    }).not.toThrowError();
  });
});


describe('Validate JSON against the ModelInfoResponse Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(LocaleSchema, LocaleSchema.$id);
  ajv.addSchema(ModelInfoRequestSchema, ModelInfoRequestSchema.$id);
  ajv.addSchema(ModelInfoResponseSchema, ModelInfoResponseSchema.$id);

  let validateFunction = ajv.getSchema(ModelInfoResponseSchema.$id as string) as ValidateFunction;

  test("A valid ModelInfoResponse object validates", () => {
    // GIVEN a valid ModelInfoResponse object
    const validModelInfoResponse: IModelInfoResponse = {
      id: getMockId(1),
      UUID: randomUUID(),
      previousUUID: "",//randomUUID(),
      originUUID: randomUUID(),
      path: "path/to/tabiya",
      tabiyaPath: "/path/to/tabiya",
      name: getTestString(NAME_MAX_LENGTH),
      description: getTestString(NAME_MAX_LENGTH),
      locale: {
        name: getTestString(NAME_MAX_LENGTH),
        UUID: randomUUID(),
        shortCode: getTestString(LOCALE_SHORTCODE_MAX_LENGTH)
      },
      releaseNotes: getTestString(RELEASE_NOTES_MAX_LENGTH),
      released: false,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      version: getTestString(VERSION_MAX_LENGTH)
    }
    // WHEN the object is validated
    const result = validateFunction(validModelInfoResponse);

    // THEN no errors are returned
    expect(validateFunction.errors).toBeNull();
    // AND the object validates
    expect(result).toBeTruthy();
  });

  test("A ModelInfoResponse object with extra properties does not validate", () => {
    // GIVEN a ModelInfoResponse object with extra properties
    const validModelInfoResponse: IModelInfoResponse = {
      id: getMockId(1),
      UUID: randomUUID(),
      previousUUID: randomUUID(),
      originUUID: randomUUID(),
      path: "path/to/tabiya",
      tabiyaPath: "/path/to/tabiya",
      name: getTestString(NAME_MAX_LENGTH),
      description: getTestString(NAME_MAX_LENGTH),
      locale: {
        name: getTestString(NAME_MAX_LENGTH),
        UUID: randomUUID(),
        shortCode: getTestString(LOCALE_SHORTCODE_MAX_LENGTH)
      },
      releaseNotes: getTestString(RELEASE_NOTES_MAX_LENGTH),
      released: false,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      version: getTestString(VERSION_MAX_LENGTH),
      //@ts-ignore
      extraProperty: "foo"
    }
    // WHEN the object is validated
    const result = validateFunction(validModelInfoResponse);

    // THEN no errors are returned
    expect(validateFunction.errors).not.toBeNull();
    // AND the object validates
    expect(result).toBeFalsy();
  });


  describe("Fail properties validation", () => {


    describe("Fail validation '/id'", () => {
      test.each([
        ["undefined", undefined, {
          instancePath: "",
          keyword: "required",
          message: "must have required property 'id'"
        }],
        ["null", null, {instancePath: "/id", keyword: "type", message: "must be string"}],
        ["not a 12 Byte id", "", {
          instancePath: "/id",
          keyword: "pattern",
          message: `must match pattern "${RegExp_Str_ID}"`
        }],
      ])
      ("Fail validation '/id' because it is %s", (caseDescription, value, failure) => {
        const spec: Partial<IModelInfoResponse> = {
          //@ts-ignore
          id: value
        };
        assertValidationErrors(validateFunction, spec, failure);
      });
    });

    describe("Fail validation '/UUID'", () => {
      test.each([
        ["undefined", undefined, {
          instancePath: "",
          keyword: "required",
          message: "must have required property 'UUID'"
        }],
        ["null", null, {instancePath: "/UUID", keyword: "type", message: "must be string"}],
        ["not a UUID v4", "foo", {
          instancePath: "/UUID",
          keyword: "pattern",
          message: `must match pattern "${RegExp_Str_UUIDv4}"`
        }],
      ])
      ("Fail validation '/UUID' because it is %s", (caseDescription, value, failure) => {
        const spec: Partial<IModelInfoResponse> = {
          //@ts-ignore
          UUID: value
        };
        assertValidationErrors(validateFunction, spec, failure);
      });
    });

    describe("Fail validation '/path'", () => {
      test.each([
        ["null", null, {instancePath: "/path", keyword: "type", message: "must be string"}],
        ["empty", "", {
          instancePath: "/path",
          keyword: "pattern",
          message: `must match pattern "${RegExp_Str_NotEmptyString}"`
        }],
        ["only whitespace characters", WHITESPACE, {
          instancePath: "/path",
          keyword: "pattern",
          message: `must match pattern "${RegExp_Str_NotEmptyString}"`
        }],
        [`more than ${PATH_MAX_LENGTH} characters`, "a".repeat(PATH_MAX_LENGTH + 1), {
          instancePath: "/path",
          keyword: "maxLength",
          message: `must NOT have more than ${PATH_MAX_LENGTH} characters`
        }],
      ])
      ("Fail validation '/path' because it is %s", (caseDescription, value, failure) => {
        const spec: Partial<IModelInfoResponse> = {
          //@ts-ignore
          path: value
        };
        assertValidationErrors(validateFunction, spec, failure);
      });
    });

    describe("Fail validation '/tabiyaPath'", () => {
      test.each([
        ["null", null, {instancePath: "/tabiyaPath", keyword: "type", message: "must be string"}],
        ["empty", "", {
          instancePath: "/tabiyaPath",
          keyword: "pattern",
          message: `must match pattern "${RegExp_Str_NotEmptyString}"`
        }],
        ["only whitespace characters", WHITESPACE, {
          instancePath: "/tabiyaPath",
          keyword: "pattern",
          message: `must match pattern "${RegExp_Str_NotEmptyString}"`
        }],
        [`more that ${PATH_MAX_LENGTH} characters`, "a".repeat(PATH_MAX_LENGTH + 1), {
          instancePath: "/tabiyaPath",
          keyword: "maxLength",
          message: `must NOT have more than ${PATH_MAX_LENGTH} characters`
        }],
      ])
      ("Fail validation '/tabiyaPath' because it is %s", (caseDescription, value, failure) => {
        const spec: Partial<IModelInfoResponse> = {
          //@ts-ignore
          tabiyaPath: value
        };
        assertValidationErrors(validateFunction, spec, failure);
      });
    });

    describe("Fail validation '/released'", () => {
      test.each([
        ["undefined", undefined, {
          instancePath: "",
          keyword: "required",
          message: "must have required property 'released'"
        }],
        ["null", null, {instancePath: "/released", keyword: "type", message: "must be boolean"}]
      ])
      ("Fail validation '/released' because it is %s", (caseDescription, value, failure) => {
        const spec: Partial<IModelInfoResponse> = {
          //@ts-ignore
          released: value
        };
        assertValidationErrors(validateFunction, spec, failure);
      });
    });

    describe("Fail validation '/releaseNotes'", () => {
      test.each([
        ["undefined", undefined, {
          instancePath: "",
          keyword: "required",
          message: "must have required property 'released'"
        }],
        ["null", null, {instancePath: "/releaseNotes", keyword: "type", message: "must be string"}],
        [`more than ${RELEASE_NOTES_MAX_LENGTH} characters`, "a".repeat(RELEASE_NOTES_MAX_LENGTH + 1), {
          instancePath: "/releaseNotes",
          keyword: "maxLength",
          message: `must NOT have more than ${RELEASE_NOTES_MAX_LENGTH} characters`
        }],
      ])
      ("Fail validation '/releaseNotes' because it is %s", (caseDescription, value, failure) => {
        const spec: Partial<IModelInfoResponse> = {
          //@ts-ignore
          releaseNotes: value
        };
        assertValidationErrors(validateFunction, spec, failure);
      });
    });

    describe("Fail validation '/version'", () => {
      test.each([
        ["undefined", undefined, {
          instancePath: "",
          keyword: "required",
          message: "must have required property 'released'"
        }],
        ["null", null, {instancePath: "/version", keyword: "type", message: "must be string"}],
        [`more than ${VERSION_MAX_LENGTH} characters`, "a".repeat(VERSION_MAX_LENGTH + 1), {
          instancePath: "/version",
          keyword: "maxLength",
          message: `must NOT have more than ${VERSION_MAX_LENGTH} characters`
        }],
      ])
      ("Fail validation '/version' because it is %s", (caseDescription, value, failure) => {
        const spec: Partial<IModelInfoResponse> = {
          //@ts-ignore
          version: value
        };
        assertValidationErrors(validateFunction, spec, failure);
      });
    });

    testExpectedFailValuesForSchemaProperty_DateTime( "createdAt", validateFunction);

    testExpectedFailValuesForSchemaProperty_DateTime( "updatedAt", validateFunction);
  });

  describe("Successfully validate properties", () => {
    testExpectedSuccessfulValuesForSchemaProperty_DateTime( "createdAt", validateFunction);

    testExpectedSuccessfulValuesForSchemaProperty_DateTime( "updatedAt", validateFunction);
  })
});



