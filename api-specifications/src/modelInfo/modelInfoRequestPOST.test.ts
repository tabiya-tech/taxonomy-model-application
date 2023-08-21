import Ajv,{ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import {ModelInfoRequestSchemaPOST} from "./modelInfoRequestPOST";
import {LocaleSchema} from "./locale";
import {getTestString} from "../_test_utilities/specialCharacters";
import {LOCALE_SHORTCODE_MAX_LENGTH, NAME_MAX_LENGTH} from "./modelInfo.constants";
import {randomUUID} from "crypto";
import {ModelInfo} from "./modelInfo.types";

describe('Test the ModelInfoRequestSchemaPOST Schema', () => {
  test("The ModelInfoRequestSchemaPOST module can be required via the index", () => {
    expect(() => {
      expect(require("modelInfo/index").ModelInfoResponseSchemaPOST).toBeDefined();
    }).not.toThrowError();
  })

  test("The ModelInfoRequestSchemaPOST schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(LocaleSchema, LocaleSchema.$id);
      ajv.addSchema(ModelInfoRequestSchemaPOST, ModelInfoRequestSchemaPOST.$id);
      ajv.getSchema(ModelInfoRequestSchemaPOST.$id as string);
    }).not.toThrowError();
  });
});

describe('Validate JSON against the ModelInfoRequestSchemaPOST Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  ajv.addSchema(LocaleSchema, LocaleSchema.$id);
  ajv.addSchema(ModelInfoRequestSchemaPOST, ModelInfoRequestSchemaPOST.$id);

  let validateFunction = ajv.getSchema(ModelInfoRequestSchemaPOST.$id as string) as ValidateFunction;

  test("A valid ModelInfo POST request object validates", () => {
    // GIVEN a valid ModelInfo POST request object
    const validModelInfoRequest: ModelInfo.POST.Request.Payload = {
      name: getTestString(NAME_MAX_LENGTH),
      description: getTestString(NAME_MAX_LENGTH),
      locale: {
        name: getTestString(NAME_MAX_LENGTH),
        UUID: randomUUID(),
        shortCode: getTestString(LOCALE_SHORTCODE_MAX_LENGTH)
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
    const validModelInfoRequest: ModelInfo.POST.Request.Payload = {
      name: getTestString(NAME_MAX_LENGTH),
      description: getTestString(NAME_MAX_LENGTH),
      locale: {
        name: getTestString(NAME_MAX_LENGTH),
        UUID: randomUUID(),
        shortCode: getTestString(LOCALE_SHORTCODE_MAX_LENGTH),

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

