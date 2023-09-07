import Ajv, {ValidateFunction} from "ajv";
import ModelInfo from "./index"
import addFormats from "ajv-formats";
import Locale from "../locale"
import ImportProcessState from "../importProcessState";
import {randomUUID} from "crypto";
import {getTestString} from "../_test_utilities/specialCharacters";
import {getMockId} from "../_test_utilities/mockMongoId";

describe("Test ModelInfo Schema", () => {
  test("should be required without errors", () => {
    // GIVEN the ModelInfo module
    // WHEN the module is required via the index
    // THEN it should not throw an error
    expect(() => {
      require('./');
    }).not.toThrowError();

    let modelInfoModule = require('./').default;
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

  test.each([["ModelInfo.GET.Response.Schema", ModelInfo.GET.Response.Schema], ["ModelInfo.POST.Response.Schema", ModelInfo.POST.Response.Schema], ["ModelInfo.POST.Request.Schema", ModelInfo.POST.Request.Schema]])
  ("%s schema is a valid Schema", (description, givenSchema) => {
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
    id: getMockId(1),
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
    version: getTestString(ModelInfo.Constants.VERSION_MAX_LENGTH),
    importProcessState: {
      id: getMockId(1),
      status: ImportProcessState.Enums.Status.PENDING,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }]
  const givenValidModelInfoPOSTResponse = {
    id: getMockId(1),
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
    version: getTestString(ModelInfo.Constants.VERSION_MAX_LENGTH),
    importProcessState: {
      id: getMockId(1),
      status: ImportProcessState.Enums.Status.PENDING,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

  test.each([
    // GIVEN a ModelInfoResponseGET object and corresponding schema
    ["ModelInfo.GET.Response.Schema", givenValidModelInfoGETResponse, ModelInfo.GET.Response.Schema],
    // GIVEN a ModelInfoResponsePOST object and corresponding schema
    ["ModelInfo.POST.Response.Schema", givenValidModelInfoPOSTResponse, ModelInfo.POST.Response.Schema],
    // GIVEN a ModelInfoRequestPOST object and corresponding schema
    ["ModelInfo.POST.Request.Schema", givenValidModelInfoPOSTRequest, ModelInfo.POST.Request.Schema],
  ])
  ("Schema %s validates a valid object", (description, givenValidObject, givenSchema) => {
    // WHEN the object is validated
    const validateFunction = ajv.getSchema(givenSchema.$id as string) as ValidateFunction;
    const isValid = validateFunction(givenValidObject);

    // THEN expect the object to validate successfully
    expect(isValid).toBe(true);
  });

  test.each([
    // GIVEN a ModelInfoResponseGET object and corresponding schema
    ["ModelInfo.GET.Response.Schema", givenValidModelInfoGETResponse, ModelInfo.GET.Response.Schema],
    // GIVEN a ModelInfoResponsePOST object and corresponding schema
    ["ModelInfo.POST.Response.Schema", givenValidModelInfoPOSTResponse, ModelInfo.POST.Response.Schema],
    // GIVEN a ModelInfoRequestPOST object and corresponding schema
    ["ModelInfo.POST.Request.Schema", givenValidModelInfoPOSTRequest, ModelInfo.POST.Request.Schema],
  ])("Schema %s does not validate object with additional properties", (description, givenValidObject, givenSchema) => {
    // GIVEN the object has an additional property
    const givenObjectWithAdditionalProperties = {...givenValidObject, foo: "bar"};

    // WHEN the object is validated
    const validateFunction = ajv.getSchema(givenSchema.$id as string) as ValidateFunction;
    const isValid = validateFunction(givenObjectWithAdditionalProperties);

    // THEN expect the object to not validate
    expect(isValid).toBe(false);
    expect(validateFunction.errors).not.toBeNull();
  })
});