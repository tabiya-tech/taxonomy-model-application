import Ajv, {ValidateFunction} from "ajv";
import {ModelInfoResponseSchemaGET} from "./modelInfoResponseGET";
import addFormats from "ajv-formats";
import {LocaleSchema} from "./locale";
import {randomUUID} from "crypto";
import {getTestString} from "../_test_utilities/specialCharacters";
import {
  LOCALE_SHORTCODE_MAX_LENGTH, NAME_MAX_LENGTH, RELEASE_NOTES_MAX_LENGTH, VERSION_MAX_LENGTH
} from "./modelInfo.constants";

describe("Test ModelInfoResponseGET Schema", () => {
  test("The ModelInfoResponseGET module can be required via the index", () => {
    //GIVEN the ModelInfoResponseGET module
    //WHEN the module is required via the index
    const actualModelInfoResponseGETModule = require("./index").ModelInfoResponseSchemaGET
    //THEN expect the module to be defined
    expect(() => {
      expect(actualModelInfoResponseGETModule).toBeDefined();
    }).not.toThrowError();
  })
  test("The ModelInfoResponseGET schema is a valid Schema", () => {
    //GIVEN the ModelInfoResponseGET schema
    //WHEN the schema is validated
    //THEN expect the schema to be valid
    expect(() => {
      const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
      addFormats(ajv);
      ajv.compile(LocaleSchema);
      ajv.compile(ModelInfoResponseSchemaGET);
    }).not.toThrowError();
  })
})

describe("Validate JSON against the ModelInfoResponseGET Schema", () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(ModelInfoResponseSchemaGET, ModelInfoResponseSchemaGET.$id);
  ajv.addSchema(LocaleSchema, LocaleSchema.$id)
  ajv.getSchema(ModelInfoResponseSchemaGET.$id as string);
  const validateFunction = ajv.getSchema(ModelInfoResponseSchemaGET.$id as string) as ValidateFunction;
  const givenValidModelInfoResponseGET = [{
    id: "foo", UUID: randomUUID(), previousUUID: "",//randomUUID(),
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
    released: false, updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    version: getTestString(VERSION_MAX_LENGTH)
  }];
  test.each([
    // GIVEN a valid ModelInfoResponseGET object
    ["A valid ModelInfo GET Response object", givenValidModelInfoResponseGET],
    // GIVEN an empty array
    ["An empty array", []]])("%s validates", (description, givenValidModelInfoResponseGET) => {

    // WHEN the object is validated
    const isValid = validateFunction(givenValidModelInfoResponseGET);

    // THEN expect the object to validate successfully
    expect(isValid).toBe(true);
  })

  test("A ModelInfo GET Response object with additional properties does not validate", () => {
    // GIVEN a ModelInfoResponseGET object with additional properties
    const givenInvalidModelInfoResponseGET = givenValidModelInfoResponseGET.map((ModelInfoResponseGET) => ({
      ...ModelInfoResponseGET,
      extraProperty: "foobar"
    }));

    // WHEN the object is validated
    const isValid = validateFunction(givenInvalidModelInfoResponseGET);

    // THEN expect the object to not validate
    expect(isValid).toBe(false);
    expect(validateFunction.errors).not.toBeNull();
  })
})