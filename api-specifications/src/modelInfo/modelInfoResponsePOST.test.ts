import Ajv,{ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import * as Locale from "../locale"
import * as ModelInfo from './index';
import {getTestString} from "../_test_utilities/specialCharacters";
import {randomUUID} from "crypto";

describe('Test the ModelInfoResponseSchemaPOST Schema', () => {
  test("The ModelInfoRequestSchema module can be required via the index", () => {
    expect(() => {
      expect(require("modelInfo/index").Schema.POST.Response).toBeDefined();
    }).not.toThrowError();
  })

  test("The ModelInfoResponseSchemaPOST schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(ModelInfo.Schema.POST.Request, ModelInfo.Schema.POST.Request.$id);
      ajv.addSchema(Locale.Schema.GET.Response, Locale.Schema.GET.Response.$id);
      ajv.addSchema(ModelInfo.Schema.POST.Response, ModelInfo.Schema.POST.Response.$id);
      ajv.getSchema(ModelInfo.Schema.POST.Response.$id as string);
    }).not.toThrowError();
  });
});


describe('Validate JSON against the ModelInfoResponseSchemaPOST Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(Locale.Schema.GET.Response, Locale.Schema.GET.Response.$id);
  ajv.addSchema(ModelInfo.Schema.POST.Request, ModelInfo.Schema.POST.Request.$id);
  ajv.addSchema(ModelInfo.Schema.POST.Response, ModelInfo.Schema.POST.Response.$id);

  let validateFunction = ajv.getSchema(ModelInfo.Schema.POST.Response.$id as string) as ValidateFunction;

  test("A valid ModelInfo POST Response object validates", () => {
    // GIVEN a valid ModelInfo POST Response object
    const validModelInfoResponsePOST : ModelInfo.Types.POST.Response.Payload = {
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
    // WHEN the object is validated
    const result = validateFunction(validModelInfoResponsePOST);

    // THEN no errors are returned
    expect(validateFunction.errors).toBeNull();
    // AND the object validates
    expect(result).toBeTruthy();
  });

  test("A ModelInfo POST Response object with extra properties does not validate", () => {
    // GIVEN a ModelInfo POST Response object with extra properties
    const validModelInfoResponsePOST : ModelInfo.Types.POST.Response.Payload = {
      id: "foo",
      UUID: randomUUID(),
      previousUUID: randomUUID(),
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
      version: getTestString(ModelInfo.Constants.VERSION_MAX_LENGTH),
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



