import Ajv, {ValidateFunction} from "ajv";
import * as ModelInfo from "./index"
import addFormats from "ajv-formats";
import * as Locale from "../locale"
import {randomUUID} from "crypto";
import {getTestString} from "../_test_utilities/specialCharacters";

describe("Test ModelInfoResponseGET Schema", () => {
  test("The ModelInfoResponseGET module can be required via the index", () => {
    //GIVEN the ModelInfoResponseGET module
    //WHEN the module is required via the index
    const actualModelInfoResponseGETModule = require("./index").Schema.GET.Response
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
      ajv.compile(Locale.Schema.GET.Response);
      ajv.compile(ModelInfo.Schema.GET.Response);
    }).not.toThrowError();
  })
})

describe("Validate JSON against the ModelInfoResponseGET Schema", () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(ModelInfo.Schema.GET.Response, ModelInfo.Schema.GET.Response.$id);
  ajv.addSchema(Locale.Schema.GET.Response, Locale.Schema.GET.Response.$id)
  ajv.getSchema(ModelInfo.Schema.GET.Response.$id as string);
  const validateFunction = ajv.getSchema(ModelInfo.Schema.GET.Response.$id as string) as ValidateFunction;
  const givenValidModelInfoResponseGET = [{
    id: "foo", UUID: randomUUID(), previousUUID: "",//randomUUID(),
    originUUID: randomUUID(),
    path: "path/to/tabiya",
    tabiyaPath: "/path/to/tabiya",
    name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
    description: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
    locale: {
      name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
    },
    releaseNotes: getTestString(ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH),
    released: false, updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    version: getTestString(ModelInfo.Constants.VERSION_MAX_LENGTH)
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