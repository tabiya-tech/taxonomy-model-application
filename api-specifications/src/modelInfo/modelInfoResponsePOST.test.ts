import Ajv,{ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import {ModelInfoResponseSchemaPOST} from "./modelInfoResponsePOST"
import {ModelInfoRequestSchemaPOST} from "./modelInfoRequestPOST";
import {LocaleSchema} from "./locale";
import {ModelInfo} from "./modelInfo.types";
import {getTestString} from "../_test_utilities/specialCharacters";
import {
  LOCALE_SHORTCODE_MAX_LENGTH,
  NAME_MAX_LENGTH,
  RELEASE_NOTES_MAX_LENGTH,
  VERSION_MAX_LENGTH
} from "./modelInfo.constants";
import {randomUUID} from "crypto";

describe('Test the ModelInfoResponseSchemaPOST Schema', () => {
  test("The ModelInfoRequestSchema module can be required via the index", () => {
    expect(() => {
      expect(require("modelInfo/index").ModelInfoResponseSchemaPOST).toBeDefined();
    }).not.toThrowError();
  })

  test("The ModelInfoResponseSchemaPOST schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(ModelInfoRequestSchemaPOST, ModelInfoRequestSchemaPOST.$id);
      ajv.addSchema(LocaleSchema, LocaleSchema.$id);
      ajv.addSchema(ModelInfoResponseSchemaPOST, ModelInfoResponseSchemaPOST.$id);
      ajv.getSchema(ModelInfoResponseSchemaPOST.$id as string);
    }).not.toThrowError();
  });
});


describe('Validate JSON against the ModelInfoResponseSchemaPOST Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(LocaleSchema, LocaleSchema.$id);
  ajv.addSchema(ModelInfoRequestSchemaPOST, ModelInfoRequestSchemaPOST.$id);
  ajv.addSchema(ModelInfoResponseSchemaPOST, ModelInfoResponseSchemaPOST.$id);

  let validateFunction = ajv.getSchema(ModelInfoResponseSchemaPOST.$id as string) as ValidateFunction;

  test("A valid ModelInfo POST Response object validates", () => {
    // GIVEN a valid ModelInfo POST Response object
    const validModelInfoResponsePOST : ModelInfo.POST.Response.Payload = {
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
    const result = validateFunction(validModelInfoResponsePOST);

    // THEN no errors are returned
    expect(validateFunction.errors).toBeNull();
    // AND the object validates
    expect(result).toBeTruthy();
  });

  test("A ModelInfo POST Response object with extra properties does not validate", () => {
    // GIVEN a ModelInfo POST Response object with extra properties
    const validModelInfoResponsePOST : ModelInfo.POST.Response.Payload = {
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
    const result = validateFunction(validModelInfoResponsePOST);

    // THEN errors are returned
    expect(validateFunction.errors).not.toBeNull();
    // AND the object does not validate
    expect(result).toBeFalsy();
  });
});



