import mongoose from "mongoose";
import { setConfiguration } from "server/config/config";
import { ITranslatedStringArrayDoc, ITranslatedStringDoc } from "common/language/translatedString.types";
import {
  ATL_LABELS_MAX_ITEMS,
  DESCRIPTION_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  TranslatedAltLabelsProperty,
  TranslatedDefinitionProperty,
  TranslatedDescriptionProperty,
  TranslatedPreferredLabelProperty,
  TranslatedRegulatedProfessionNoteProperty,
  TranslatedScopeNoteProperty,
} from "./modelSchema";

/**
 * The validator of a translated property, the property factories build it, mongoose calls it for every path that is
 * built with them.
 */
function getValidator(property: unknown): (value: unknown) => boolean {
  return (property as { validate: (value: unknown) => boolean }).validate;
}

/**
 * Validates a value against a translated property.
 * @returns the error the property throws, or undefined when the value is valid
 */
function validateProperty(property: unknown, value: unknown): Error | undefined {
  try {
    getValidator(property)(value);
    return undefined;
  } catch (error: unknown) {
    return error as Error;
  }
}

describe("Test the translated properties of the model schema", () => {
  beforeEach(() => {
    // the environment is not configured, the fall back language is english, the one of the registry
    // @ts-ignore
    setConfiguration(undefined);
  });

  describe("Test the translated string properties", () => {
    test.each([
      ["TranslatedPreferredLabelProperty", TranslatedPreferredLabelProperty],
      ["TranslatedDescriptionProperty", TranslatedDescriptionProperty],
      ["TranslatedDefinitionProperty", TranslatedDefinitionProperty],
      ["TranslatedScopeNoteProperty", TranslatedScopeNoteProperty],
      ["TranslatedRegulatedProfessionNoteProperty", TranslatedRegulatedProfessionNoteProperty],
    ])("%s should accept a value that is translated in the languages of the registry", (_name, givenProperty) => {
      // GIVEN a value that is translated in english and in french
      const givenValue = { en: "Cook", fr: "Cuisinier" };

      // WHEN the value is validated
      const actualError = validateProperty(givenProperty, givenValue);

      // THEN expect the value to be valid
      expect(actualError).toBeUndefined();
    });

    test.each([
      ["TranslatedPreferredLabelProperty", TranslatedPreferredLabelProperty, "preferredLabel"],
      ["TranslatedDescriptionProperty", TranslatedDescriptionProperty, "description"],
      ["TranslatedDefinitionProperty", TranslatedDefinitionProperty, "definition"],
      ["TranslatedScopeNoteProperty", TranslatedScopeNoteProperty, "scopeNote"],
      [
        "TranslatedRegulatedProfessionNoteProperty",
        TranslatedRegulatedProfessionNoteProperty,
        "regulatedProfessionNote",
      ],
    ])(
      "%s should reject a value that is not translated in the fallback language",
      (_name, givenProperty, givenFieldName) => {
        // GIVEN a value that is translated in french only
        const givenValue = { fr: "Cuisinier" };

        // WHEN the value is validated
        const actualError = validateProperty(givenProperty, givenValue);

        // THEN expect the value to be rejected because the fallback language is missing
        expect(actualError?.message).toBe(`${givenFieldName} must be translated in the fallback language 'en'`);
      }
    );

    test("should accept a value that is hydrated as a map, as mongoose builds it", () => {
      // GIVEN a value that is hydrated as a map
      const givenValue = new Map([
        ["en", "Cook"],
        ["fr", "Cuisinier"],
      ]);

      // WHEN the value is validated
      const actualError = validateProperty(TranslatedPreferredLabelProperty, givenValue);

      // THEN expect the value to be valid
      expect(actualError).toBeUndefined();
    });

    test.each([
      ["is missing", undefined],
      ["is null", null],
      ["is a string", "Cook"],
      ["is an array", [{ en: "Cook" }]],
    ])("should reject a value that %s", (_description, givenValue) => {
      // GIVEN the given value

      // WHEN the value is validated
      const actualError = validateProperty(TranslatedPreferredLabelProperty, givenValue);

      // THEN expect the value to be rejected because it is not a translated value
      expect(actualError?.message).toBe("preferredLabel must be a translated object");
    });

    test("should reject a value that is translated in a language that is not in the registry", () => {
      // GIVEN a value that is translated in a language the platform does not know about
      const givenValue = { en: "Cook", tlh: "nuqneH" };

      // WHEN the value is validated
      const actualError = validateProperty(TranslatedPreferredLabelProperty, givenValue);

      // THEN expect the value to be rejected because the language is not supported
      expect(actualError?.message).toBe("preferredLabel has an unsupported language 'tlh'");
    });

    test("should reject a value that is not a string in one language", () => {
      // GIVEN a value whose french translation is not a string
      const givenValue = { en: "Cook", fr: 1 };

      // WHEN the value is validated
      const actualError = validateProperty(TranslatedPreferredLabelProperty, givenValue);

      // THEN expect the value to be rejected because the translation is not a string
      expect(actualError?.message).toBe("preferredLabel must be a string for the language 'fr'");
    });

    test("should reject a value that is longer than the maximum length in one language", () => {
      // GIVEN a value whose french translation is longer than the maximum length of a label
      const givenValue = { en: "Cook", fr: "a".repeat(LABEL_MAX_LENGTH + 1) };

      // WHEN the value is validated
      const actualError = validateProperty(TranslatedPreferredLabelProperty, givenValue);

      // THEN expect the value to be rejected because the translation is too long
      expect(actualError?.message).toBe(
        `preferredLabel must be at most ${LABEL_MAX_LENGTH} chars long for the language 'fr'`
      );
    });

    test("should accept a value that is at most the maximum length in every language", () => {
      // GIVEN a value whose english translation is exactly the maximum length of a description
      const givenValue = { en: "a".repeat(DESCRIPTION_MAX_LENGTH) };

      // WHEN the value is validated
      const actualError = validateProperty(TranslatedDescriptionProperty, givenValue);

      // THEN expect the value to be valid
      expect(actualError).toBeUndefined();
    });

    test.each([
      ["is empty", ""],
      ["is blank", "   "],
    ])("should reject a preferredLabel that %s in one language", (_description, givenTranslation) => {
      // GIVEN a preferred label whose french translation is the given translation
      const givenValue = { en: "Cook", fr: givenTranslation };

      // WHEN the value is validated
      const actualError = validateProperty(TranslatedPreferredLabelProperty, givenValue);

      // THEN expect the value to be rejected because a preferred label must be specified
      expect(actualError?.message).toBe("preferredLabel must not be empty for the language 'fr'");
    });

    test.each([
      ["TranslatedDescriptionProperty", TranslatedDescriptionProperty],
      ["TranslatedDefinitionProperty", TranslatedDefinitionProperty],
      ["TranslatedScopeNoteProperty", TranslatedScopeNoteProperty],
      ["TranslatedRegulatedProfessionNoteProperty", TranslatedRegulatedProfessionNoteProperty],
    ])("%s should accept a value that is empty in one language", (_name, givenProperty) => {
      // GIVEN a value whose french translation is empty
      const givenValue = { en: "A person who cooks", fr: "" };

      // WHEN the value is validated
      const actualError = validateProperty(givenProperty, givenValue);

      // THEN expect the value to be valid
      expect(actualError).toBeUndefined();
    });

    test("should require the configured fallback language instead of the one of the registry", () => {
      // GIVEN the environment falls back to french
      // @ts-ignore
      setConfiguration({ fallbackLanguage: "fr" });
      // AND a value that is translated in english only
      const givenValue = { en: "Cook" };

      // WHEN the value is validated
      const actualError = validateProperty(TranslatedPreferredLabelProperty, givenValue);

      // THEN expect the value to be rejected because the configured fallback language is missing
      expect(actualError?.message).toBe("preferredLabel must be translated in the fallback language 'fr'");
    });
  });

  describe("Test the translated alt labels property", () => {
    test("should accept a list of values that are translated in the languages of the registry", () => {
      // GIVEN a list of values that are translated in english and in french
      const givenValue = [
        { en: "Cook", fr: "Cuisinier" },
        { en: "Chef", fr: "Chef de cuisine" },
      ];

      // WHEN the list is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the list to be valid
      expect(actualError).toBeUndefined();
    });

    test("should accept an empty list", () => {
      // GIVEN an empty list
      const givenValue: object[] = [];

      // WHEN the list is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the list to be valid
      expect(actualError).toBeUndefined();
    });

    test("should accept the same value in two languages of the same item", () => {
      // GIVEN a list where an item carries the same value in english and in french
      const givenValue = [{ en: "Chef", fr: "Chef" }];

      // WHEN the list is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the list to be valid
      expect(actualError).toBeUndefined();
    });

    test.each([
      ["is not a list", { en: "Cook" }],
      ["is missing", undefined],
      ["is null", null],
    ])("should reject a value that %s", (_description, givenValue) => {
      // GIVEN the given value

      // WHEN the value is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the value to be rejected because it is not a list
      expect(actualError?.message).toBe("altLabels must be an array");
    });

    test("should reject a list that has more items than the maximum", () => {
      // GIVEN a list that has one item more than the maximum
      const givenValue = Array.from({ length: ATL_LABELS_MAX_ITEMS + 1 }, (_item, index) => ({ en: `Label ${index}` }));

      // WHEN the list is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the list to be rejected because it has too many items
      expect(actualError?.message).toBe(`altLabels must be at most ${ATL_LABELS_MAX_ITEMS} items`);
    });

    test("should reject a list with an item that is not translated in the fallback language", () => {
      // GIVEN a list where the second item is translated in french only
      const givenValue = [{ en: "Cook", fr: "Cuisinier" }, { fr: "Chef de cuisine" }];

      // WHEN the list is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the list to be rejected because the fallback language is missing
      expect(actualError?.message).toBe("altLabels must be translated in the fallback language 'en'");
    });

    test("should reject a list with an item that is translated in a language that is not in the registry", () => {
      // GIVEN a list with an item that is translated in a language the platform does not know about
      const givenValue = [{ en: "Cook", tlh: "nuqneH" }];

      // WHEN the list is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the list to be rejected because the language is not supported
      expect(actualError?.message).toBe("altLabels has an unsupported language 'tlh'");
    });

    test("should reject a list with an item that is longer than the maximum length in one language", () => {
      // GIVEN a list with an item whose english value is longer than the maximum length of a label
      const givenValue = [{ en: "a".repeat(LABEL_MAX_LENGTH + 1) }];

      // WHEN the list is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the list to be rejected because the value is too long
      expect(actualError?.message).toBe(
        `altLabels must be at most ${LABEL_MAX_LENGTH} chars long for the language 'en'`
      );
    });

    test("should reject a list with an item that is empty in one language", () => {
      // GIVEN a list with an item whose french value is empty
      const givenValue = [{ en: "Cook", fr: "" }];

      // WHEN the list is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the list to be rejected because an alternative label must be specified
      expect(actualError?.message).toBe("altLabels must not be empty for the language 'fr'");
    });

    test("should reject a list that carries the same value twice in the same language", () => {
      // GIVEN a list where two items carry the same english value
      const givenValue = [
        { en: "Cook", fr: "Cuisinier" },
        { en: "Cook", fr: "Chef de cuisine" },
      ];

      // WHEN the list is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the list to be rejected because the english value is duplicated
      expect(actualError?.message).toBe("Duplicate altLabels found for the language 'en'");
    });

    test("should accept a list where a value of one language is the value of another language of another item", () => {
      // GIVEN a list where the french value of the second item is the english value of the first one
      const givenValue = [
        { en: "Cook", fr: "Cuisinier" },
        { en: "Chef", fr: "Cook" },
      ];

      // WHEN the list is validated
      const actualError = validateProperty(TranslatedAltLabelsProperty, givenValue);

      // THEN expect the list to be valid
      expect(actualError).toBeUndefined();
    });
  });

  describe("Test the translated properties as paths of a mongoose schema", () => {
    // GIVEN a model that carries a translated string path and a translated list of strings path
    type ITestTranslatedEntity = {
      preferredLabel: ITranslatedStringDoc;
      altLabels: ITranslatedStringArrayDoc;
    };
    const givenMongoose = new mongoose.Mongoose();
    const givenSchema = new givenMongoose.Schema<ITestTranslatedEntity>({
      preferredLabel: TranslatedPreferredLabelProperty,
      altLabels: TranslatedAltLabelsProperty,
    });
    const givenModel = givenMongoose.model<ITestTranslatedEntity>("TestTranslatedEntity", givenSchema);

    test("should validate an entity whose translated paths are valid", async () => {
      // GIVEN an entity whose translated paths are translated in english and in french
      const givenEntity = new givenModel({
        preferredLabel: { en: "Cook", fr: "Cuisinier" },
        altLabels: [{ en: "Chef", fr: "Chef de cuisine" }],
      });

      // WHEN the entity is validated
      const actualValidation = givenEntity.validate();

      // THEN expect the entity to be valid
      await expect(actualValidation).resolves.toBeUndefined();
      // AND expect the translated paths to be stored as maps
      expect(givenEntity.preferredLabel.get("fr")).toBe("Cuisinier");
      expect(givenEntity.altLabels[0].get("fr")).toBe("Chef de cuisine");
    });

    test("should not validate an entity whose translated paths are not translated in the fallback language", async () => {
      // GIVEN an entity whose preferred label is translated in french only
      const givenEntity = new givenModel({
        preferredLabel: { fr: "Cuisinier" },
        altLabels: [],
      });

      // WHEN the entity is validated
      const actualValidation = givenEntity.validate();

      // THEN expect the entity to be rejected because the fallback language is missing
      await expect(actualValidation).rejects.toThrowError(
        "preferredLabel must be translated in the fallback language 'en'"
      );
    });

    test("should not validate an entity whose translated paths are missing", async () => {
      // GIVEN an entity that carries no translated path at all
      const givenEntity = new givenModel({});

      // WHEN the entity is validated
      const actualValidation = givenEntity.validate();

      // THEN expect the entity to be rejected because the translated paths are required
      await expect(actualValidation).rejects.toThrowError(mongoose.Error.ValidationError);
    });
  });
});
