import {randomUUID} from "crypto";
import {getTestString} from "../_test_utilities/specialCharacters";
import {
  testSchemaWithInvalidObject,
  testSchemaWithValidObject,
  testValidSchema
} from "../_test_utilities/stdSchemaTests";
import LocaleAPISpecs from "./index";


describe('Test the Locale Schema', () => {
  // GIVEN the Locale.Schemas.Payload schema
  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema("LocaleAPISpecs.Schemas.Payload", LocaleAPISpecs.Schemas.Payload);
});

describe('Validate JSON against the Locale Schema', () => {
  // GIVEN a valid Locale object
  const givenValidLocale : LocaleAPISpecs.Types.Payload = {
    name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
    UUID: randomUUID(),
    shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
  }

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject("LocaleAPISpecs.Schemas.Payload", LocaleAPISpecs.Schemas.Payload, givenValidLocale)

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithInvalidObject("LocaleAPISpecs.Schemas.Payload", LocaleAPISpecs.Schemas.Payload, givenValidLocale)
});

