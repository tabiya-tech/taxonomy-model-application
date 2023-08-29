import Ajv,{ValidateFunction} from "ajv";
import * as Locale from './index'
import * as ModelInfo from '../modelInfo'
import {randomUUID} from "crypto";
import {getTestString} from "../_test_utilities/specialCharacters";


describe('Test the LocaleSchema Schema', () => {
  test("The LocaleSchema module can be required via the index", () => {
    expect(() => {
      expect(require("locale").Schema.GET.Response).toBeDefined();
    }).not.toThrowError();
  })

  test("The LocaleSchema schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    expect(() => {
      ajv.addSchema(Locale.Schema.GET.Response, Locale.Schema.GET.Response.$id);
      ajv.getSchema(Locale.Schema.GET.Response.$id as string);
    }).not.toThrowError();
  });
});

describe('Validate JSON against the Locale Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  ajv.addSchema(Locale.Schema.GET.Response, Locale.Schema.GET.Response.$id);
  let validateFunction = ajv.getSchema(Locale.Schema.GET.Response.$id as string) as ValidateFunction;

  test("A valid Locale object validates", () => {
    // GIVEN a valid Locale object
    const validLocale:Locale.Types.ILocale = {
      name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    }
    // WHEN the object is validated
    const result = validateFunction(validLocale);

    // THEN no errors are returned
    expect(validateFunction.errors).toBeNull();
    // AND the object validates
    expect(result).toBeTruthy();
  });

  test("A Locale object with extra properties does not validate", () => {
    // GIVEN a Locale object with extra properties
    const validLocale:Locale.Types.ILocale = {
      name: "foo",
      UUID: randomUUID(),
      shortCode: "baz",
      // @ts-ignore
      extraProperty: "bar"
    }
    // WHEN the object is validated
    const result = validateFunction(validLocale);

    // THEN no errors are returned
    expect(validateFunction.errors).not.toBeNull();
    // AND the object validates
    expect(result).toBeFalsy();
  });
});

