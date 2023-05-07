import Ajv,{ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import {IModelInfoResponse, ModelInfoResponseSchema} from "./modelInfoResponse";
import {IModelInfoRequest, ModelInfoRequestSchema} from "./modelInfoRequest";
import {LocaleSchema} from "./locale";
import {getTestString} from "../_test_utilities/specialCharacters";
import {
  LOCALE_SHORTCODE_MAX_LENGTH,
  NAME_MAX_LENGTH,
  RELEASE_NOTES_MAX_LENGTH,
  VERSION_MAX_LENGTH
} from "./modelInfo.constants";
import {randomUUID} from "crypto";

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
    const validModelInfoResponse : IModelInfoResponse = {
      id: "foo",
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
    const validModelInfoResponse : IModelInfoResponse = {
      id: "foo",
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
});



