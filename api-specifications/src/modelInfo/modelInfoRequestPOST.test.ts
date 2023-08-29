import Ajv,{ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import * as ModelInfo from "./index";
import * as Locale from "../locale"
import {getTestString} from "../_test_utilities/specialCharacters";
import {randomUUID} from "crypto";

describe('Test the ModelInfoRequestSchemaPOST Schema', () => {
  test("The ModelInfoRequestSchemaPOST module can be required via the index", () => {
    expect(() => {
      expect(require("modelInfo/index").Schema.POST.Request).toBeDefined();
    }).not.toThrowError();
  })

  test("The ModelInfoRequestSchemaPOST schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(Locale.Schema.GET.Response, Locale.Schema.GET.Response.$id);
      ajv.addSchema(ModelInfo.Schema.POST.Request, ModelInfo.Schema.POST.Request.$id);
      ajv.getSchema(ModelInfo.Schema.POST.Request.$id as string);
    }).not.toThrowError();
  });
});

describe('Validate JSON against the ModelInfoRequestSchemaPOST Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  ajv.addSchema(Locale.Schema.GET.Response, Locale.Schema.GET.Response.$id);
  ajv.addSchema(ModelInfo.Schema.POST.Request, ModelInfo.Schema.POST.Request.$id);

  let validateFunction = ajv.getSchema(ModelInfo.Schema.POST.Request.$id as string) as ValidateFunction;

  test("A valid ModelInfo POST request object validates", () => {
    // GIVEN a valid ModelInfo POST request object
    const validModelInfoRequest: ModelInfo.Types.POST.Request.Payload = {
      name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
      description: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
      locale: {
        name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
        UUID: randomUUID(),
        shortCode: getTestString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      }
    }
    // WHEN the object is validated
    const result = validateFunction(validModelInfoRequest);

    // THEN no errors are returned
    expect(validateFunction.errors).toBeNull();
    // AND the object validates
    expect(result).toBeTruthy();
  });

  test("A ModelInfo POST request object with extra properties does not validate", () => {
    // GIVEN a ModelInfo POST request object with extra properties
    const validModelInfoRequest: ModelInfo.Types.POST.Request.Payload = {
      name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
      description: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
      locale: {
        name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
        UUID: randomUUID(),
        shortCode: getTestString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH),

      },
      //@ts-ignore
      extraProperty: "bar",
    }
    // WHEN the object is validated
    const result = validateFunction(validModelInfoRequest);

    // THEN no errors are returned
    expect(validateFunction.errors).not.toBeNull();
    // AND the object validates
    expect(result).toBeFalsy();
  });
});

