import Ajv,{ValidateFunction} from "ajv";
import Locale from './index'
import ModelInfo from '../modelInfo'
import {randomUUID} from "crypto";
import {getTestString} from "../_test_utilities/specialCharacters";


describe('Test the Schema Schema', () => {
  test("The Schema module can be required via the index", () => {
    //GIVEN the  module
    //WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
       require('./');
      }).not.toThrowError();
      // AND check if Schema is defined in it
      expect(require("./").default.Schemas.Payload).toBeDefined();
    }).not.toThrowError();
  })

  test("The Schema schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    expect(() => {
      ajv.addSchema(Locale.Schemas.Payload, Locale.Schemas.Payload.$id);
      ajv.getSchema(Locale.Schemas.Payload.$id as string);
    }).not.toThrowError();
  });
});

describe('Validate JSON against the Locale Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  ajv.addSchema(Locale.Schemas.Payload, Locale.Schemas.Payload.$id);
  let validateFunction = ajv.getSchema(Locale.Schemas.Payload.$id as string) as ValidateFunction;

  test("A valid Locale object validates", () => {
    // GIVEN a valid Locale object
    const validLocale : Locale.Types.Payload = {
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
    const validLocale:Locale.Types.Payload = {
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

