import Ajv, { SchemaObject, ValidateFunction } from "ajv";
import LanguageConstants from "./constants";
import LanguageTypes from "./types";
import { getTranslatedStringArraySchema, getTranslatedStringSchema } from "./translatedString";
import { RegExp_Str_NotEmptyString } from "../regex";

const givenMaxLength = 10;
const givenMaxItems = 3;
const givenFallBackDbKeyName = LanguageConstants.FALLBACK_LANGUAGE.dbKeyName;

function getValidateFunction(givenSchema: SchemaObject): ValidateFunction {
  const ajvInstance = new Ajv({ validateSchema: true, allErrors: true, strict: true });
  return ajvInstance.compile(givenSchema);
}

describe("Test the translated string schema factory", () => {
  describe("Test getTranslatedStringSchema()", () => {
    test("the schema should be a valid schema", () => {
      // GIVEN a translated string schema
      const givenSchema = getTranslatedStringSchema({ description: "The preferred label", maxLength: givenMaxLength });

      // WHEN the schema is compiled
      const actualCompilation = () => getValidateFunction(givenSchema);

      // THEN expect the compilation to succeed
      expect(actualCompilation).not.toThrowError();
    });

    test("the schema should have a property for every language of the registry", () => {
      // GIVEN a translated string schema
      const givenSchema = getTranslatedStringSchema({ description: "The preferred label", maxLength: givenMaxLength });
      // AND the dbKeyName of every language of the registry
      const expectedDbKeyNames = LanguageConstants.Languages.map((language) => language.dbKeyName);

      // WHEN the properties of the schema are read
      const actualDbKeyNames = Object.keys(givenSchema.properties);

      // THEN expect a property for every language of the registry and for no other language
      expect(actualDbKeyNames).toEqual(expectedDbKeyNames);
    });

    test("the schema should constrain the maxLength of every language", () => {
      // GIVEN a translated string schema
      const givenSchema = getTranslatedStringSchema({ description: "The preferred label", maxLength: givenMaxLength });

      // WHEN the maxLength of every language is read
      const actualMaxLengths = Object.values(givenSchema.properties).map(
        (property) => (property as SchemaObject).maxLength
      );

      // THEN expect every language to be constrained to the given maxLength
      expect(actualMaxLengths).toEqual(LanguageConstants.Languages.map(() => givenMaxLength));
    });

    test("the schema should constrain the pattern of every language when a pattern is given", () => {
      // GIVEN a translated string schema that is built with a pattern
      const givenSchema = getTranslatedStringSchema({
        description: "The preferred label",
        maxLength: givenMaxLength,
        pattern: RegExp_Str_NotEmptyString,
      });

      // WHEN the pattern of every language is read
      const actualPatterns = Object.values(givenSchema.properties).map(
        (property) => (property as SchemaObject).pattern
      );

      // THEN expect every language to be constrained to the given pattern
      expect(actualPatterns).toEqual(LanguageConstants.Languages.map(() => RegExp_Str_NotEmptyString));
    });

    test("the schema should not constrain the pattern of any language when no pattern is given", () => {
      // GIVEN a translated string schema that is built without a pattern
      const givenSchema = getTranslatedStringSchema({ description: "The description", maxLength: givenMaxLength });

      // WHEN the pattern of every language is read
      const actualPatterns = Object.values(givenSchema.properties).map((property) =>
        Object.prototype.hasOwnProperty.call(property, "pattern")
      );

      // THEN expect no language to carry a pattern
      expect(actualPatterns).toEqual(LanguageConstants.Languages.map(() => false));
    });

    test("the schema should validate a value that is translated in every language of the registry", () => {
      // GIVEN a translated string schema
      const givenSchema = getTranslatedStringSchema({ description: "The preferred label", maxLength: givenMaxLength });
      // AND a value that is translated in every language of the registry
      const givenValue: LanguageTypes.ITranslatedString = {};
      LanguageConstants.Languages.forEach((language) => {
        givenValue[language.dbKeyName] = language.csvSuffix;
      });

      // WHEN the value is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the value to be valid
      expect(actualIsValid).toBe(true);
    });

    test("the schema should validate a value that is translated in a single language", () => {
      // GIVEN a translated string schema
      const givenSchema = getTranslatedStringSchema({ description: "The preferred label", maxLength: givenMaxLength });
      // AND a value that is translated in the fall back language only
      const givenValue: LanguageTypes.ITranslatedString = { [givenFallBackDbKeyName]: "Cook" };

      // WHEN the value is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the value to be valid
      expect(actualIsValid).toBe(true);
    });

    test("the schema should not validate a value that is translated in a language that is not in the registry", () => {
      // GIVEN a translated string schema
      const givenSchema = getTranslatedStringSchema({ description: "The preferred label", maxLength: givenMaxLength });
      // AND a value that is translated in a language that is not in the registry
      const givenValue = { tlh: "nuqneH" };

      // WHEN the value is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the value to be invalid
      expect(actualIsValid).toBe(false);
    });

    test("the schema should not validate a value that is longer than the maxLength in one language", () => {
      // GIVEN a translated string schema
      const givenSchema = getTranslatedStringSchema({ description: "The preferred label", maxLength: givenMaxLength });
      // AND a value that is longer than the maxLength in a single language
      const givenValue: LanguageTypes.ITranslatedString = {
        [givenFallBackDbKeyName]: "a".repeat(givenMaxLength + 1),
      };

      // WHEN the value is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the value to be invalid
      expect(actualIsValid).toBe(false);
    });

    test("the schema should not validate a value that does not match the pattern in one language", () => {
      // GIVEN a translated string schema that is built with a pattern
      const givenSchema = getTranslatedStringSchema({
        description: "The preferred label",
        maxLength: givenMaxLength,
        pattern: RegExp_Str_NotEmptyString,
      });
      // AND a value that is empty in a single language
      const givenValue: LanguageTypes.ITranslatedString = { [givenFallBackDbKeyName]: "   " };

      // WHEN the value is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the value to be invalid
      expect(actualIsValid).toBe(false);
    });

    test("the schema should not validate a value that is not a string in one language", () => {
      // GIVEN a translated string schema
      const givenSchema = getTranslatedStringSchema({ description: "The preferred label", maxLength: givenMaxLength });
      // AND a value that is not a string in a single language
      const givenValue = { [givenFallBackDbKeyName]: 1 };

      // WHEN the value is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the value to be invalid
      expect(actualIsValid).toBe(false);
    });

    test("the schema should require the fall back language when the translated value is required", () => {
      // GIVEN a translated string schema of a required field
      const givenSchema = getTranslatedStringSchema({
        description: "The preferred label",
        maxLength: givenMaxLength,
        required: true,
      });
      // AND a value that is not translated in the fall back language
      const givenValue = { fr: "Cuisinier" };

      // WHEN the value is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the value to be invalid
      expect(actualIsValid).toBe(false);
      // AND expect the schema to require the fall back language
      expect(givenSchema.required).toEqual([givenFallBackDbKeyName]);
    });

    test("the schema should not require any language when the translated value is not required", () => {
      // GIVEN a translated string schema of a field that is not required
      const givenSchema = getTranslatedStringSchema({ description: "The description", maxLength: givenMaxLength });
      // AND a value that is not translated in any language
      const givenValue = {};

      // WHEN the value is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the value to be valid
      expect(actualIsValid).toBe(true);
      // AND expect the schema to not require any language
      expect(givenSchema.required).toBeUndefined();
    });

    test("the schema should match the snapshot", () => {
      // GIVEN a translated string schema
      const givenSchema = getTranslatedStringSchema({
        description: "The preferred label",
        maxLength: givenMaxLength,
        pattern: RegExp_Str_NotEmptyString,
        required: true,
      });

      // WHEN the schema is inspected
      // THEN expect the schema to match the snapshot
      expect(givenSchema).toMatchSnapshot();
    });

    describe("Test allowNullToDelete", () => {
      test("the schema should not allow null for any language when allowNullToDelete is not given", () => {
        // GIVEN a translated string schema built without allowNullToDelete
        const givenSchema = getTranslatedStringSchema({
          description: "The preferred label",
          maxLength: givenMaxLength,
        });

        // WHEN a non-fallback language is set to null
        const actualIsValid = getValidateFunction(givenSchema)({ fr: null });

        // THEN expect the value to be invalid
        expect(actualIsValid).toBe(false);
      });

      test("the schema should allow null for a non fallback language when allowNullToDelete is true", () => {
        // GIVEN a translated string schema built with allowNullToDelete
        const givenSchema = getTranslatedStringSchema({
          description: "The preferred label",
          maxLength: givenMaxLength,
          allowNullToDelete: true,
        });

        // WHEN a non-fallback language is set to null
        const actualIsValid = getValidateFunction(givenSchema)({ fr: null });

        // THEN expect the value to be valid
        expect(actualIsValid).toBe(true);
      });

      test("the schema should not allow null for the fallback language even when allowNullToDelete is true", () => {
        // GIVEN a translated string schema built with allowNullToDelete
        const givenSchema = getTranslatedStringSchema({
          description: "The preferred label",
          maxLength: givenMaxLength,
          allowNullToDelete: true,
        });

        // WHEN the fallback language is set to null
        const actualIsValid = getValidateFunction(givenSchema)({ [givenFallBackDbKeyName]: null });

        // THEN expect the value to be invalid
        expect(actualIsValid).toBe(false);
      });

      test("the schema should still allow a string value for a non fallback language when allowNullToDelete is true", () => {
        // GIVEN a translated string schema built with allowNullToDelete
        const givenSchema = getTranslatedStringSchema({
          description: "The preferred label",
          maxLength: givenMaxLength,
          allowNullToDelete: true,
        });

        // WHEN a non-fallback language is set to a string
        const actualIsValid = getValidateFunction(givenSchema)({ fr: "Cuisinier" });

        // THEN expect the value to be valid
        expect(actualIsValid).toBe(true);
      });

      test("the schema should still enforce maxLength for a non fallback language when allowNullToDelete is true", () => {
        // GIVEN a translated string schema built with allowNullToDelete
        const givenSchema = getTranslatedStringSchema({
          description: "The preferred label",
          maxLength: givenMaxLength,
          allowNullToDelete: true,
        });

        // WHEN a non-fallback language is set to a value longer than the maxLength
        const actualIsValid = getValidateFunction(givenSchema)({ fr: "a".repeat(givenMaxLength + 1) });

        // THEN expect the value to be invalid
        expect(actualIsValid).toBe(false);
      });

      test("the schema should match the snapshot", () => {
        // GIVEN a translated string schema built with allowNullToDelete
        const givenSchema = getTranslatedStringSchema({
          description: "The preferred label",
          maxLength: givenMaxLength,
          pattern: RegExp_Str_NotEmptyString,
          allowNullToDelete: true,
        });

        // WHEN the schema is inspected
        // THEN expect the schema to match the snapshot
        expect(givenSchema).toMatchSnapshot();
      });
    });
  });

  describe("Test getTranslatedStringArraySchema()", () => {
    const getGivenArraySchema = () =>
      getTranslatedStringArraySchema({
        description: "The alternative labels",
        maxLength: givenMaxLength,
        maxItems: givenMaxItems,
        pattern: RegExp_Str_NotEmptyString,
      });

    test("the schema should be a valid schema", () => {
      // GIVEN a translated string array schema
      const givenSchema = getGivenArraySchema();

      // WHEN the schema is compiled
      const actualCompilation = () => getValidateFunction(givenSchema);

      // THEN expect the compilation to succeed
      expect(actualCompilation).not.toThrowError();
    });

    test("the schema should validate an empty list", () => {
      // GIVEN a translated string array schema
      const givenSchema = getGivenArraySchema();
      // AND an empty list of translated values
      const givenValue: LanguageTypes.ITranslatedStringArray = [];

      // WHEN the list is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the list to be valid
      expect(actualIsValid).toBe(true);
    });

    test("the schema should validate a list of translated values", () => {
      // GIVEN a translated string array schema
      const givenSchema = getGivenArraySchema();
      // AND a list of translated values
      const givenValue: LanguageTypes.ITranslatedStringArray = [
        { [givenFallBackDbKeyName]: "Cook", fr: "Cuisinier" },
        { [givenFallBackDbKeyName]: "Chef" },
      ];

      // WHEN the list is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the list to be valid
      expect(actualIsValid).toBe(true);
    });

    test("the schema should not validate a list with more items than the maxItems", () => {
      // GIVEN a translated string array schema
      const givenSchema = getGivenArraySchema();
      // AND a list that has more items than the maxItems
      const givenValue: LanguageTypes.ITranslatedStringArray = Array.from(
        { length: givenMaxItems + 1 },
        (_item, index) => ({ [givenFallBackDbKeyName]: `Label ${index}` })
      );

      // WHEN the list is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the list to be invalid
      expect(actualIsValid).toBe(false);
    });

    test("the schema should not validate a list with duplicate items", () => {
      // GIVEN a translated string array schema
      const givenSchema = getGivenArraySchema();
      // AND a list that carries the same translated value twice
      const givenValue: LanguageTypes.ITranslatedStringArray = [
        { [givenFallBackDbKeyName]: "Cook" },
        { [givenFallBackDbKeyName]: "Cook" },
      ];

      // WHEN the list is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the list to be invalid
      expect(actualIsValid).toBe(false);
    });

    test("the schema should require the fall back language of every item, as the database does", () => {
      // GIVEN a translated string array schema
      const givenSchema = getGivenArraySchema();
      // AND a list with an item that is not translated in the fall back language
      const givenValue = [{ fr: "Cuisinier" }];

      // WHEN the list is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the list to be invalid, so that the payload does not reach the database only to be rejected there
      expect(actualIsValid).toBe(false);
      // AND expect the schema of an item to require the fall back language
      expect(givenSchema.items.required).toEqual([givenFallBackDbKeyName]);
    });

    test("the schema should not reject a list that carries the same value in a single language, the database does", () => {
      // GIVEN a translated string array schema
      const givenSchema = getGivenArraySchema();
      // AND a list of two items that carry the same english value but are not identical
      const givenValue: LanguageTypes.ITranslatedStringArray = [
        { [givenFallBackDbKeyName]: "Cook" },
        { [givenFallBackDbKeyName]: "Cook", fr: "Cuisinier" },
      ];

      // WHEN the list is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the list to be valid, uniqueItems only rejects items that are identical in every language, the
      // uniqueness of a value within a single language is a rule that JSON Schema cannot express and that the
      // database enforces on its own
      expect(actualIsValid).toBe(true);
    });

    test("the schema should not validate a list with an item that is translated in a language that is not in the registry", () => {
      // GIVEN a translated string array schema
      const givenSchema = getGivenArraySchema();
      // AND a list with an item that is translated in a language that is not in the registry
      const givenValue = [{ tlh: "nuqneH" }];

      // WHEN the list is validated
      const actualIsValid = getValidateFunction(givenSchema)(givenValue);

      // THEN expect the list to be invalid
      expect(actualIsValid).toBe(false);
    });

    test("the schema should match the snapshot", () => {
      // GIVEN a translated string array schema
      const givenSchema = getGivenArraySchema();

      // WHEN the schema is inspected
      // THEN expect the schema to match the snapshot
      expect(givenSchema).toMatchSnapshot();
    });
  });
});
