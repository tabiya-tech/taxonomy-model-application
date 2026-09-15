import { getTestString } from "_test_utilities/specialCharacters";
import {
  testNonEmptyStringField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import LanguageAPISpecs from "./index";

describe("Test the Language Schema", () => {
  // GIVEN the LanguageAPISpecs.Schemas.Payload schema
  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema("LanguageAPISpecs.Schemas.Payload", LanguageAPISpecs.Schemas.Payload);

  describe("Validate JSON against the Language Schema", () => {
    // GIVEN a valid Language object
    const givenValidLanguage: LanguageAPISpecs.Types.Payload = {
      name: getTestString(LanguageAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LanguageAPISpecs.Constants.SHORT_CODE_MAX_LENGTH),
      dbKeyName: getTestString(LanguageAPISpecs.Constants.DB_KEY_NAME_MAX_LENGTH),
      csvSuffix: getTestString(LanguageAPISpecs.Constants.CSV_SUFFIX_MAX_LENGTH),
    };

    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject("LanguageAPISpecs.Schemas.Payload", LanguageAPISpecs.Schemas.Payload, givenValidLanguage);

    // AND WHEN the object has additional properties
    // THEN expect the object to not validate
    testSchemaWithAdditionalProperties(
      "LanguageAPISpecs.Schemas.Payload",
      LanguageAPISpecs.Schemas.Payload,
      givenValidLanguage
    );
  });

  describe("Validate the registry against the Language Schema", () => {
    // GIVEN every language of the registry
    LanguageAPISpecs.Constants.Languages.forEach((givenLanguage) => {
      // WHEN the language is validated
      // THEN expect the language to validate successfully
      testSchemaWithValidObject(
        `LanguageAPISpecs.Schemas.Payload for the language '${givenLanguage.name}'`,
        LanguageAPISpecs.Schemas.Payload,
        givenLanguage
      );
    });
  });

  describe("validate LanguageAPISpecs.Schemas.Payload fields", () => {
    describe("Test validation of 'name'", () => {
      testNonEmptyStringField("name", LanguageAPISpecs.Constants.NAME_MAX_LENGTH, LanguageAPISpecs.Schemas.Payload);
    });

    describe("Test validation of 'shortCode'", () => {
      testNonEmptyStringField(
        "shortCode",
        LanguageAPISpecs.Constants.SHORT_CODE_MAX_LENGTH,
        LanguageAPISpecs.Schemas.Payload
      );
    });

    describe("Test validation of 'dbKeyName'", () => {
      testNonEmptyStringField(
        "dbKeyName",
        LanguageAPISpecs.Constants.DB_KEY_NAME_MAX_LENGTH,
        LanguageAPISpecs.Schemas.Payload
      );
    });

    describe("Test validation of 'csvSuffix'", () => {
      testNonEmptyStringField(
        "csvSuffix",
        LanguageAPISpecs.Constants.CSV_SUFFIX_MAX_LENGTH,
        LanguageAPISpecs.Schemas.Payload
      );
    });
  });
});
