import Ajv,{ValidateFunction} from "ajv";
import {LocaleSchema} from "./locale";
import {randomUUID} from "crypto";
import {getTestString} from "../_test_utilities/specialCharacters";
import {LOCALE_SHORTCODE_MAX_LENGTH, NAME_MAX_LENGTH} from "./modelInfo.constants";
import {ILocale} from "./modelInfo.types";


describe('Test the LocaleSchema Schema', () => {
  test("The LocaleSchema module can be required via the index", () => {
    expect(() => {
      expect(require("modelInfo/index").LocaleSchema).toBeDefined();
    }).not.toThrowError();
  })

  test("The LocaleSchema schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    expect(() => {
      ajv.addSchema(LocaleSchema, LocaleSchema.$id);
      ajv.getSchema(LocaleSchema.$id as string);
    }).not.toThrowError();
  });
});

describe('Validate JSON against the Locale Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  ajv.addSchema(LocaleSchema, LocaleSchema.$id);
  let validateFunction = ajv.getSchema(LocaleSchema.$id as string) as ValidateFunction;

  test("A valid Locale object validates", () => {
    // GIVEN a valid Locale object
    const validLocale:ILocale = {
      name: getTestString(NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(LOCALE_SHORTCODE_MAX_LENGTH),
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
    const validLocale:ILocale = {
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

