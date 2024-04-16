import Ajv from "ajv";

import addFormats from "ajv-formats";

import Locales from "../public/locales.json";

import LocaleAPISpecs from "api-specifications/locale";

let ajvInstance: Ajv;

beforeEach(() => {
  ajvInstance = new Ajv({
    validateSchema: true,
    allErrors: true,
    strict: true,
  });
  addFormats(ajvInstance);
});

const Schema = LocaleAPISpecs.Schemas.Payload;

/**
 * Test the Locale JSON File
 */
describe("Locale JSON File tests", () => {
  Locales.forEach((locale) => {
    describe(`validation for locale ${locale.name}`, () => {
      // GIVEN a valid Locale object
      const givenLocale = locale;

      // WHEN the object is validated
      // THEN expect the object to validate successfully
      test(`Schema LocaleAPISpecs.Schemas.Payload validates a valid object`, () => {
        ajvInstance.addSchema(Schema, Schema.$id);
        const validateFunction = ajvInstance.getSchema(Schema.$id as string);

        if (typeof validateFunction !== "function") {
          throw new Error(`Schema with ID ${Schema.$id} was not found in AJV instance.`);
        }
        // WHEN the object is validated
        const isValid = validateFunction(givenLocale);

        // THEN expect the object to validate successfully
        expect(isValid).toBe(true);
        // AND no errors to be present
        expect(validateFunction.errors).toBeNull();
      });

      // AND WHEN the object has additional properties
      // THEN expect the object to not validate
      test(`Schema LocaleAPISpecs.Schemas.Payload does not validate object with additional properties`, () => {
        // GIVEN the object has an additional property
        const givenObjectWithAdditionalProperties = { ...givenLocale, foo: "bar" };

        ajvInstance.addSchema(Schema, Schema.$id);
        const validateFunction = ajvInstance.getSchema(Schema.$id as string);

        if (typeof validateFunction !== "function") {
          throw new Error(`Schema with ID ${Schema.$id} was not found in AJV instance.`);
        }

        // WHEN the object is validated
        const isValid = validateFunction(givenObjectWithAdditionalProperties);

        // THEN expect the object to not validate
        expect(isValid).toBe(false);
        expect(validateFunction.errors).not.toBeNull();
      });
    });
  });

  test("uniqueness locale short codes", () => {
    const shortCodes = Locales.map((locale) => locale.shortCode);
    const uniqueShortCodes = new Set(shortCodes);
    expect(shortCodes.length).toBe(uniqueShortCodes.size);
  });

  test("uniqueness locale names", () => {
    const names = Locales.map((locale) => locale.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  test("uniqueness of locale UUIDs", () => {
    const uuids = Locales.map((locale) => locale.UUID);
    const uniqueUUIDs = new Set(uuids);
    expect(uuids.length).toBe(uniqueUUIDs.size);
  });
});
