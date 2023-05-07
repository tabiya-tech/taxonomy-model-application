import Ajv,{ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import {IModelInfoRequest, ModelInfoRequestSchema} from "./modelInfoRequest";
import {LocaleSchema} from "./locale";
import {getTestString} from "../_test_utilities/specialCharacters";
import {LOCALE_SHORTCODE_MAX_LENGTH, NAME_MAX_LENGTH} from "./modelInfo.constants";
import {randomUUID} from "crypto";

describe('Test the ModelInfoRequestSchema Schema', () => {
  test("The ModelInfoRequestSchema module can be required via the index", () => {
    expect(() => {
      expect(require("modelInfo/index").ModelInfoRequestSchema).toBeDefined();
    }).not.toThrowError();
  })

  test("The ModelInfoRequestSchema schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(LocaleSchema, LocaleSchema.$id);
      ajv.addSchema(ModelInfoRequestSchema, ModelInfoRequestSchema.$id);
      ajv.getSchema(ModelInfoRequestSchema.$id as string);
    }).not.toThrowError();
  });
});

describe('Validate JSON against the ModelInfoRequest Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  ajv.addSchema(LocaleSchema, LocaleSchema.$id);
  ajv.addSchema(ModelInfoRequestSchema, ModelInfoRequestSchema.$id);

  let validateFunction = ajv.getSchema(ModelInfoRequestSchema.$id as string) as ValidateFunction;

  test("A valid ModelInfoRequest object validates", () => {
    // GIVEN a valid ModelInfoRequest object
    const validModelInfoRequest: IModelInfoRequest = {
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

  test("A ModelInfoRequest object with extra properties does not validate", () => {
    // GIVEN a ModelInfoRequest object with extra properties
    const validModelInfoRequest: IModelInfoRequest = {
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

