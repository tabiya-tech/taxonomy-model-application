import Ajv, {ValidateFunction} from "ajv";
import ModelInfo from "./index"
import addFormats from "ajv-formats";
import Locale from "../locale"
import {randomUUID} from "crypto";
import {getTestString} from "../_test_utilities/specialCharacters";

describe("Test ModelInfo Schema", () => {
  test("should be required without errors", () => {
    // GIVEN the ModelInfo module
    // WHEN the module is required via the index
    // THEN it should not throw an error
    expect(() => {
      require('./index');
    }).not.toThrowError();

    let modelInfoModule = require('./index').default;
    // AND the schemas should be defined
    expect(modelInfoModule.GET.Response.Schema).toBeDefined();
    expect(modelInfoModule.POST.Response.Schema).toBeDefined();
    expect(modelInfoModule.POST.Request.Schema).toBeDefined();

    // AND the constants should be defined
    const Constants = modelInfoModule.Constants;
    expect(Constants.NAME_MAX_LENGTH).toBeDefined();
    expect(Constants.LOCALE_SHORTCODE_MAX_LENGTH).toBeDefined();
    expect(Constants.MAX_PAYLOAD_LENGTH).toBeDefined();
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
    expect(Constants.RELEASE_NOTES_MAX_LENGTH).toBeDefined();
    expect(Constants.VERSION_MAX_LENGTH).toBeDefined();
  });

  test.each([["ModelInfoResponseGET", ModelInfo.GET.Response.Schema], ["ModelInfoResponsePOST", ModelInfo.POST.Response.Schema], ["ModelInfoRequestPOST", ModelInfo.POST.Request.Schema]])("%s schema is a valid Schema", (description, givenSchema) => {
    // GIVEN the givenSchema
    // WHEN the givenSchema is validated
    // THEN expect the givenSchema to be valid
    expect(() => {
      const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
      addFormats(ajv);
      ajv.compile(Locale.Schema);
      ajv.compile(givenSchema);
    }).not.toThrowError();
  })
})

  describe("Validate JSON against the Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    //GIVEN the modelInfo schemas
    const givenSchemas = [ModelInfo.GET.Response.Schema, ModelInfo.POST.Response.Schema, ModelInfo.POST.Request.Schema];
    givenSchemas.forEach(schema => ajv.addSchema(schema, schema.$id));
    ajv.addSchema(Locale.Schema, Locale.Schema.$id)

    // AND valid ModelInfoResponseGET, ModelInfoResponsePOST, ModelInfoRequestPOST objects
    const givenValidModelInfoGETResponse = [{
      id: "foo",
      UUID: randomUUID(),
      previousUUID: "",//randomUUID(),
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
      released: false,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      version: getTestString(ModelInfo.Constants.VERSION_MAX_LENGTH)
    }]
    const givenValidModelInfoPOSTResponse = {
      id: "foo",
      UUID: randomUUID(),
      previousUUID: "",//randomUUID(),
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
      released: false,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      version: getTestString(ModelInfo.Constants.VERSION_MAX_LENGTH)
    }
    const givenValidModelInfoPOSTRequest = {
      name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
      description: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
      locale: {
        name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
        UUID: randomUUID(),
        shortCode: getTestString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      }
    }

    test.each(
      // GIVEN a valid ModelInfoResponseGET object
      [["ModelInfoResponseGET", "a valid ModelInfoResponseGET object", givenSchemas[0], givenValidModelInfoGETResponse],
        // GIVEN an empty array
        ["ModelInfoResponseGET", "an empty array", givenSchemas[0], []],
        // GIVEN a valid  ModelInfoResponsePOST object
        ["ModelInfoResponsePOST", "a valid ModelInfoResponsePost object", givenSchemas[1], givenValidModelInfoPOSTResponse],
        // GIVEN a valid  ModelInfoRequestPOST object
        ["ModelInfoRequestPOST", "a valid ModelInfoRequestPOST object", givenSchemas[2], givenValidModelInfoPOSTRequest]])("%s validates with %s", (testDescription, payloadDescription, schema, payload) => {
      // WHEN the object is validated
      const validateFunction = ajv.getSchema(schema.$id as string) as ValidateFunction;
      const isValid = validateFunction(payload);

      // THEN expect the object to validate successfully
      expect(isValid).toBe(true);
    });

    test.each([
      // GIVEN a ModelInfoResponseGET object with additional properties
      [{...givenValidModelInfoGETResponse, foo:"bar"},givenSchemas[0]],
      // GIVEN a ModelInfoResponsePOST object with additional properties
      [{...givenValidModelInfoPOSTResponse, foo:"bar"}, givenSchemas[1]],
      // GIVEN a ModelInfoRequestPOST object with additional properties
      [{...givenValidModelInfoPOSTRequest, foo: "bar"}, givenSchemas[2]],
    ])("An object with additional properties does not validate", ( payload, schema ) => {

      // WHEN the object is validated
      const validateFunction = ajv.getSchema(schema.$id as string) as ValidateFunction;
      const isValid = validateFunction(payload);

      // THEN expect the object to not validate
      expect(isValid).toBe(false);
      expect(validateFunction.errors).not.toBeNull();
    })
  });
